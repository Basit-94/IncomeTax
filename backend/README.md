# Wapsi backend

This is the Spring Boot / Java 21 boundary for the scale workstream. The Next.js app remains the
frontend and local synthetic prototype. No controller here contacts a government system.

## Local prerequisites

- Java 21 or newer
- Maven 3.9 or newer

Run from this directory:

```text
mvn test
mvn spring-boot:run
```

The current workspace has no `java`, `mvn`, or `gradle` executable, so this foundation is not
claimed compiled in this environment yet. The missing toolchain is recorded in `log.md` and is a
P21 blocker, not a reason to represent the source as verified.

## Money contract

`Money` stores integer paise in a `long`. API boundaries must use `Money`, never a raw numeric
currency value. Conversion from rupees accepts `BigDecimal` and rejects more than two decimal
places. Multiplication rounds to whole paise only when the caller supplies an explicit
`RoundingMode`.
