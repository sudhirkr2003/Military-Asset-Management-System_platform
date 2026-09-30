package com.mams.config;

import com.mams.security.jwt.AuthEntryPointJwt;
import com.mams.security.jwt.AuthTokenFilter;
import com.mams.security.jwt.CustomAccessDeniedHandler;
import com.mams.security.services.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final AuthTokenFilter authTokenFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          AuthEntryPointJwt unauthorizedHandler,
                          CustomAccessDeniedHandler accessDeniedHandler,
                          AuthTokenFilter authTokenFilter) {
        this.userDetailsService = userDetailsService;
        this.unauthorizedHandler = unauthorizedHandler;
        this.accessDeniedHandler = accessDeniedHandler;
        this.authTokenFilter = authTokenFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

            @Override
            public String encode(CharSequence rawPassword) {
                return bcrypt.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword == null || rawPassword == null) {
                    return false;
                }
                if (encodedPassword.startsWith("$2a$") || encodedPassword.startsWith("$2b$") || encodedPassword.startsWith("$2y$")) {
                    return bcrypt.matches(rawPassword, encodedPassword);
                }
                return rawPassword.toString().equals(encodedPassword);
            }
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(daoAuthenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        // 1. Public & Documentation Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()

                        // 2. Auth Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 3. Personnel Endpoints (ADMIN ONLY)
                        .requestMatchers("/api/personnel/**").hasRole("ADMIN")

                        // 4. Equipment Endpoints
                        .requestMatchers(HttpMethod.DELETE, "/api/equipment/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/equipment").hasAnyRole("ADMIN", "LOGISTICS_OFFICER")
                        .requestMatchers(HttpMethod.PUT, "/api/equipment/**").hasAnyRole("ADMIN", "LOGISTICS_OFFICER")
                        .requestMatchers(HttpMethod.GET, "/api/equipment/**").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 5. Movements Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/movements/purchase").hasAnyRole("ADMIN", "LOGISTICS_OFFICER")
                        .requestMatchers(HttpMethod.POST, "/api/movements/transfer").hasAnyRole("ADMIN", "LOGISTICS_OFFICER")
                        .requestMatchers(HttpMethod.POST, "/api/movements/assign").hasAnyRole("ADMIN", "BASE_COMMANDER")
                        .requestMatchers(HttpMethod.POST, "/api/movements/return").hasAnyRole("ADMIN", "BASE_COMMANDER")
                        .requestMatchers(HttpMethod.POST, "/api/movements/expend").hasAnyRole("ADMIN", "BASE_COMMANDER")
                        .requestMatchers(HttpMethod.GET, "/api/movements/**").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 6. Inventory Endpoints
                        .requestMatchers("/api/inventory/**").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 7. Dashboard Endpoints
                        .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 8. Bases Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/bases").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/bases/**").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 9. Reports Endpoints
                        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER")

                        // 10. Fallback: Any other /api endpoint requires authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                );

        http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
