package com.hereforthevibes.backend;

import java.util.Map;

public class RegistrationConflictException extends RuntimeException {
    private final Map<String, String> errors;

    public RegistrationConflictException(Map<String, String> errors) {
        super("Registration conflicts with an existing account.");
        this.errors = Map.copyOf(errors);
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
