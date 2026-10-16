package com.hereforthevibes.backend;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record RegisterRequest(
        @NotBlank(message = "First name is required.")
        String firstName,
        @NotBlank(message = "Last name is required.")
        String lastName,
        @NotBlank(message = "Email address is required.")
        @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$",
                message = "Enter a complete email address, like john@example.com.")
        String email,
        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = "[0-9]{10}", message = "Enter a 10-digit phone number.")
        String phone,
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 1024, message = "Password must be between 8 and 1024 characters.")
        @Pattern(regexp = "(?s).*[A-Z].*", message = "Password must include an uppercase letter.")
        @Pattern(regexp = "(?s).*[a-z].*", message = "Password must include a lowercase letter.")
        @Pattern(regexp = "(?s).*[0-9].*", message = "Password must include a number.")
        @Pattern(regexp = "(?s).*[^A-Za-z0-9].*", message = "Password must include a special character.")
        String password
) {
    public RegisterRequest {
        firstName = firstName == null ? null : firstName.strip();
        lastName = lastName == null ? null : lastName.strip();
        email = email == null ? null : email.strip().toLowerCase(Locale.ROOT);
        phone = phone == null ? null : phone.replaceAll("[\\s().-]", "");
        // Passwords must remain exactly as submitted, including spaces.
    }

    @Override
    public String toString() {
        return "RegisterRequest[redacted]";
    }
}
