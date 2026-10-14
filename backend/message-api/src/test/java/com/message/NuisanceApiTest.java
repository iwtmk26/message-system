package com.message;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class NuisanceApiTest {

    /* 画面の normalizePhone と同じ結果になること（docs/nuisance-test.md の T01〜T04） */
    @ParameterizedTest
    @CsvSource({
            "03-1234-5678, 0312345678",
            "0312345678, 0312345678",
            "０３１２３４５６７８, 0312345678",
            "+81 3-1234-5678, 0312345678",
            "＋８１ ３-１２３４-５６７８, 0312345678",
            "090 1234 5678, 09012345678"
    })
    void normalizePhone(String raw, String expected) {
        assertEquals(expected, NuisanceApi.normalizePhone(raw));
    }

    @ParameterizedTest
    @CsvSource({
            "GET /nuisance",
            "GET /nuisance/{phoneNumber}",
            "POST /nuisance",
            "PUT /nuisance/{phoneNumber}",
            "DELETE /nuisance/{phoneNumber}",
            "POST /nuisance/{phoneNumber}/logs"
    })
    void matchesNuisanceRoutes(String routeKey) {
        assertTrue(NuisanceApi.matches(routeKey));
    }

    @ParameterizedTest
    @CsvSource({
            "GET /messages",
            "POST /messages",
            "GET /members",
            "GET /nuisanceX"
    })
    void doesNotMatchOtherRoutes(String routeKey) {
        assertFalse(NuisanceApi.matches(routeKey));
    }
}
