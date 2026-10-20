package com.hereforthevibes.backend;

/** The parts of a user that are safe to send to the browser. Never includes the password hash. */
public record UserResponse(Long id, String firstName, String lastName, String email) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail());
    }
}
