package in.masti.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Security configuration: session-based JSON auth + role-based access control.
 *
 * The SPA (frontend JS) signs in via POST /api/auth/login, which stores the
 * SecurityContext in the HTTP session. CSRF uses the XSRF-TOKEN cookie, which
 * the frontend sends back as the X-XSRF-TOKEN header.
 *
 * Roles:
 * - ADMIN    — full access
 * - HR       — manage employees, departments, attendance records, approve leaves, salaries
 * - EMPLOYEE — read data, check in/out, apply for leave
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, SecurityContextRepository securityContextRepository) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // Plain handler: the SPA sends the raw cookie value back as a header
                // (the default Xor handler would reject it)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                .ignoringRequestMatchers("/h2-console/**"))
            // Force the XSRF-TOKEN cookie onto every response so the SPA can read it
            .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
            // H2 console renders in a frame
            .headers(h -> h.frameOptions(f -> f.sameOrigin()))
            .securityContext(sc -> sc.securityContextRepository(securityContextRepository))
            .authorizeHttpRequests(auth -> auth
                // Public: SPA shell, static assets, API docs, H2 console, health, auth endpoints
                .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/favicon.ico", "/error",
                        "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**",
                        "/h2-console/**", "/actuator/health", "/api/auth/**").permitAll()
                // Any authenticated user may check in/out and apply for leave
                .requestMatchers(HttpMethod.POST,
                        "/api/attendance/check-in", "/api/attendance/*/check-out", "/api/leaves").authenticated()
                // HR + ADMIN only: salaries, record management, leave decisions
                .requestMatchers("/api/salaries/**").hasAnyRole("ADMIN", "HR")
                .requestMatchers(HttpMethod.POST,
                        "/api/employees/**", "/api/departments/**").hasAnyRole("ADMIN", "HR")
                .requestMatchers(HttpMethod.PUT,
                        "/api/employees/**", "/api/departments/**", "/api/leaves/**").hasAnyRole("ADMIN", "HR")
                .requestMatchers(HttpMethod.PATCH,
                        "/api/employees/**", "/api/departments/**", "/api/attendance/**").hasAnyRole("ADMIN", "HR")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("ADMIN", "HR")
                // Everything else under /api requires a login
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            // Unauthenticated requests get a plain 401; the SPA shows its JS login view on 401
            .exceptionHandling(e -> e.defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    AnyRequestMatcher.INSTANCE));
        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Demo users (in-memory). Replace with a DB-backed UserDetailsService for real deployments.
     * admin/admin123 (ADMIN), hr/hr123 (HR), emp/emp123 (EMPLOYEE)
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("admin").password(encoder.encode("admin123")).roles("ADMIN").build(),
                User.withUsername("hr").password(encoder.encode("hr123")).roles("HR").build(),
                User.withUsername("emp").password(encoder.encode("emp123")).roles("EMPLOYEE").build()
        );
    }

    /**
     * Resolves the deferred CsrfToken on every request so the cookie-based
     * repository writes the XSRF-TOKEN cookie even on plain GETs.
     */
    static class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (token != null) {
                token.getToken();
            }
            chain.doFilter(request, response);
        }
    }
}
