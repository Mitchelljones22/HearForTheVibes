package com.hereforthevibes.backend;

import jakarta.validation.Valid;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class AuthController {

    private final RegistrationService registrationService;

    public AuthController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }


    @PostMapping("/api/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new LinkedHashMap<>();

            for (var error : bindingResult.getFieldErrors()) {
                errors.putIfAbsent(error.getField(), error.getDefaultMessage());
            }

            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }
        Long userId = registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", userId, "message", "Account created successfully."));
    }

    @ExceptionHandler(RegistrationConflictException.class)
    public ResponseEntity<?> handleConflict(RegistrationConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("errors", exception.getErrors()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleUnreadableRequest() {
        // Do not return or log parser exceptions, which may contain submitted passwords.
        return ResponseEntity.badRequest().body(Map.of("errors",
                Map.of("form", "Send a valid registration request.")));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<?> handleDatabaseFailure() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("errors",
                Map.of("form", "Registration is temporarily unavailable. Try again.")));
    }
}
