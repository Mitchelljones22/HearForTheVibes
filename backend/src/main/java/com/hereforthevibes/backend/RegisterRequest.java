package com.hereforthevibes.backend;

public record RegisterRequest(
        String fullName,
        String email,
        String phone,
        String password
) {}
