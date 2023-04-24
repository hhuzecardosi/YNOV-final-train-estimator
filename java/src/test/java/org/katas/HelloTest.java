package org.katas;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class HelloTest {

    @Test
    void shouldWork() {
        assertEquals(3, 1+2);
    }

    @Test
    void print_shouldFail() {
        var hello = new Hello();
        Assertions.assertEquals("Hello, world!", hello.print());
    }
}