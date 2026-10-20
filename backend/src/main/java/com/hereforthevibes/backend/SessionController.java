package com.hereforthevibes.backend;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Login, current user, and logout, using a server-side session.
 * The browser only holds a random session ID in an HttpOnly cookie (JSESSIONID);
 * the logged-in user's ID is stored on the server, in the session.
 */
@RestController
public class SessionController {
    static final String USER_ID = "userId";

    private final LoginService loginService;
    private final UserRepository userRepository;

    public SessionController(LoginService loginService, UserRepository userRepository) {
        this.loginService = loginService;
        this.userRepository = userRepository;
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, BindingResult bindingResult,
                                   HttpServletRequest httpRequest) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new LinkedHashMap<>();
            for (var error : bindingResult.getFieldErrors()) {
                errors.putIfAbsent(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }

        Optional<User> user = loginService.authenticate(request);
        if (user.isEmpty()) {
            // Same message whether the email or the password was wrong.
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("errors",
                    Map.of("form", "Incorrect email or password.")));
        }

        // Throw away any existing session and start a fresh one, so a session ID
        // planted before login can't be reused after it (session fixation).
        HttpSession existing = httpRequest.getSession(false);
        if (existing != null) existing.invalidate();
        httpRequest.getSession(true).setAttribute(USER_ID, user.get().getId());

        return ResponseEntity.ok(UserResponse.from(user.get()));
    }

    @GetMapping("/api/auth/me")
    public ResponseEntity<?> me(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        Object userId = session == null ? null : session.getAttribute(USER_ID);
        if (!(userId instanceof Long id)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            // The account was deleted while this session was open.
            session.invalidate();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(UserResponse.from(user.get()));
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleUnreadableRequest() {
        // Do not return or log parser exceptions, which may contain submitted passwords.
        return ResponseEntity.badRequest().body(Map.of("errors",
                Map.of("form", "Send a valid sign-in request.")));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<?> handleDatabaseFailure() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("errors",
                Map.of("form", "Sign in is temporarily unavailable. Try again.")));
    }
}
