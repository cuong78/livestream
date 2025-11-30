package com.livestream.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${server.port:8080}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("🎥 Live Streaming Platform API")
                        .version("1.0.0")
                        .description("REST API for live streaming platform with real-time chat.\n\n" +
                                "Features:\n" +
                                "- User authentication (JWT)\n" +
                                "- Live stream management (RTMP → HLS)\n" +
                                "- Real-time chat via WebSocket\n" +
                                "- Stream settings (RTMP URL, Stream Key)\n" +
                                "- Admin dashboard")
                        .contact(new Contact()
                                .name("LiveStream API Support")
                                .email("support@livestream.com")
                                .url("https://github.com/cuong78/livestream"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort + "/api")
                                .description("Local Development Server"),
                        new Server()
                                .url("http://192.168.1.9:" + serverPort + "/api")
                                .description("LAN Server (Mobile Testing)")
                ))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter JWT token obtained from /auth/login endpoint")
                                        .in(SecurityScheme.In.HEADER)
                                        .name("Authorization")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
