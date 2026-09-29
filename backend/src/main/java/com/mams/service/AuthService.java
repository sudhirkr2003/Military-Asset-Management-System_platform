package com.mams.service;

import com.mams.dto.request.LoginRequest;
import com.mams.dto.request.RegisterRequest;
import com.mams.dto.response.AuthResponse;
import com.mams.dto.response.UserSummaryDto;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);
    UserSummaryDto getCurrentUser();
    UserSummaryDto register(RegisterRequest registerRequest);
}
