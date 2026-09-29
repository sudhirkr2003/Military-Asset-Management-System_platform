package com.mams.dto.response;

public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UserSummaryDto user;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, String tokenType, UserSummaryDto user) {
        this.accessToken = accessToken;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public UserSummaryDto getUser() {
        return user;
    }

    public void setUser(UserSummaryDto user) {
        this.user = user;
    }
}
