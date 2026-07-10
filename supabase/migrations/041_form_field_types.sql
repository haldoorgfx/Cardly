-- Expand registration_form_fields.field_type to support more question types:
-- date, number, and section (a non-input heading/divider).
-- The original CHECK (migration 017) only allowed the first 7 types.

alter table registration_form_fields
  drop constraint if exists registration_form_fields_field_type_check;

alter table registration_form_fields
  add constraint registration_form_fields_field_type_check
  check (field_type in (
    'text', 'textarea', 'select', 'checkbox', 'radio', 'phone', 'url',
    'date', 'number', 'section'
  ));
