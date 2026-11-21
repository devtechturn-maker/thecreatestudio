package in.thecreatestudio.backend.proposal;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Editable proposal content (admin create/update request body). Amounts are in paise. */
public record ProposalContent(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 120) String clientName,
        @NotBlank @Email @Size(max = 255) String clientEmail,
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,30}$", message = "Enter a valid phone number") String clientPhone,
        @Size(max = 160) String clientCompany,
        @NotBlank @Size(max = 5000) String summary,
        @NotBlank @Size(max = 20000) String scope,
        @NotBlank @Size(max = 30000) String terms,
        @Min(0) @Max(100_000_000_000L) long amountPaise,
        @Min(0) @Max(100_000_000_000L) long advancePaise,
        @FutureOrPresent LocalDate validUntil) {}
