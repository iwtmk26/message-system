package com.message;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class MembersApiTest {

    @Test
    void matchesOnlyPutMember() {
        assertTrue(MembersApi.matches("PUT /members/{memberId}"));
        assertFalse(MembersApi.matches("GET /members"));
        assertFalse(MembersApi.matches("DELETE /members/{memberId}"));
    }

    @Test
    void parseRetired() {
        assertEquals(true, MembersApi.parseRetired("{\"retired\":true}"));
        assertEquals(false, MembersApi.parseRetired("{\"retired\":false}"));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "{}",
            "{\"retired\":\"true\"}",
            "{\"retired\":1}",
            "not json"
    })
    void parseRetiredRejectsOthers(String raw) {
        assertThrows(MembersApi.BadRequest.class,
                () -> MembersApi.parseRetired(raw));
    }

    @Test
    void parseRetiredRejectsMissingBody() {
        assertThrows(MembersApi.BadRequest.class,
                () -> MembersApi.parseRetired(null));
    }

    @Test
    void pathMemberId() {
        assertEquals("m1", MembersApi.pathMemberId(
                Map.of("pathParameters", Map.of("memberId", " m1 "))));
        assertThrows(MembersApi.BadRequest.class,
                () -> MembersApi.pathMemberId(Map.of()));
    }
}
