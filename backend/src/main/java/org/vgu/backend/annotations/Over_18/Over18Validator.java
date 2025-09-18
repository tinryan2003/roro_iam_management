package org.vgu.backend.annotations.Over_18;

import java.time.LocalDate;
import java.time.Period;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class Over18Validator implements ConstraintValidator<Over18, LocalDate> {

    @Override
    public boolean isValid(LocalDate dateOfBirth, ConstraintValidatorContext context) {
        if (dateOfBirth == null)
            return true;
        return Period.between(dateOfBirth, LocalDate.now()).getYears() >= 18;
    }
}
