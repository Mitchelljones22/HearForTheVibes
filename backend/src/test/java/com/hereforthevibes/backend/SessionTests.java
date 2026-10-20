package com.hereforthevibes.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite:target/session-tests.db",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class SessionTests {
    private static final String EMAIL = "jane@example.com";
    private static final String PASSWORD = "SessionTest123!";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;

    private User jane;

    @BeforeEach
    void createUser() {
        users.deleteAll();
        jane = users.save(new User("Jane", "Doe", EMAIL, passwordEncoder.encode(PASSWORD), "8165550123"));
    }

    @Test
    void correctPasswordLogsInAndReturnsUserWithoutHash() throws Exception {
        MvcResult result = login(EMAIL, PASSWORD).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(jane.getId()))
                .andExpect(jsonPath("$.firstName").value("Jane"))
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();
        assertThat(session.getAttribute(SessionController.USER_ID)).isEqualTo(jane.getId());
        assertThat(result.getResponse().getContentAsString()).doesNotContain(PASSWORD, jane.getPasswordHash());
    }

    @Test
    void emailMatchesRegardlessOfCaseOrSpaces() throws Exception {
        login("  JANE@Example.COM ", PASSWORD).andExpect(status().isOk());
    }

    @Test
    void wrongPasswordAndUnknownEmailGetTheSameResponse() throws Exception {
        MvcResult wrongPassword = login(EMAIL, "WrongPassword123!")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errors.form").value("Incorrect email or password."))
                .andReturn();
        MvcResult unknownEmail = login("nobody@example.com", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andReturn();

        assertThat(unknownEmail.getResponse().getContentAsString())
                .isEqualTo(wrongPassword.getResponse().getContentAsString());
        // A failed login must not create a session.
        assertThat(wrongPassword.getRequest().getSession(false)).isNull();
        assertThat(unknownEmail.getRequest().getSession(false)).isNull();
    }

    @Test
    void passwordIsCaseSensitive() throws Exception {
        login(EMAIL, PASSWORD.toLowerCase()).andExpect(status().isUnauthorized());
    }

    @Test
    void loginReplacesAnyExistingSession() throws Exception {
        MockHttpSession planted = new MockHttpSession();
        MvcResult result = mvc.perform(post("/api/auth/login").session(planted)
                        .contentType(MediaType.APPLICATION_JSON).content(body(EMAIL, PASSWORD)))
                .andExpect(status().isOk()).andReturn();

        assertThat(planted.isInvalid()).isTrue();
        assertThat(result.getRequest().getSession(false)).isNotSameAs(planted);
    }

    @Test
    void meReturnsLoggedInUser() throws Exception {
        MockHttpSession session = loggedInSession();
        mvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void meWithoutLoginIsUnauthorized() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void meForDeletedUserIsUnauthorized() throws Exception {
        MockHttpSession session = loggedInSession();
        users.deleteAll();
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
        assertThat(session.isInvalid()).isTrue();
    }

    @Test
    void logoutEndsTheSession() throws Exception {
        MockHttpSession session = loggedInSession();
        mvc.perform(post("/api/auth/logout").session(session)).andExpect(status().isNoContent());
        assertThat(session.isInvalid()).isTrue();
    }

    @Test
    void logoutWithoutSessionStillSucceeds() throws Exception {
        mvc.perform(post("/api/auth/logout")).andExpect(status().isNoContent());
    }

    @Test
    void missingFieldsAreRejected() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").isString())
                .andExpect(jsonPath("$.errors.password").isString());
    }

    @Test
    void malformedRequestDoesNotExposeOrLogPassword(CapturedOutput output) throws Exception {
        String response = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\""))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain(PASSWORD);
        assertThat(output.getAll()).doesNotContain(PASSWORD);
    }

    private ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(body(email, password)));
    }

    private MockHttpSession loggedInSession() throws Exception {
        return (MockHttpSession) login(EMAIL, PASSWORD).andExpect(status().isOk())
                .andReturn().getRequest().getSession(false);
    }

    private String body(String email, String password) throws Exception {
        return mapper.writeValueAsString(Map.of("email", email, "password", password));
    }
}
