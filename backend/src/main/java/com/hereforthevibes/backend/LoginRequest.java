package com.hereforthevibes.backend;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record LoginRequest(
        @NotBlank(message = "Email address is required.")
        String email,
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        @NotBlank(message = "Password is required.")
        // Same upper limit as registration, so huge inputs can't tie up the password hasher.
        @Size(max = 1024, message = "Password must be 1024 characters or fewer.")
        String password
) {
    public LoginRequest {
        // Registration stores emails trimmed and lowercased, so match that here.
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }

    @Override
    public String toString() {
        return "LoginRequest[redacted]";
    }
}
