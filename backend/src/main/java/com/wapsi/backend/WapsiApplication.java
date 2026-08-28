package com.wapsi.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
public class WapsiApplication {
    public static void main(String[] args) {
        SpringApplication.run(WapsiApplication.class, args);
    }
}
