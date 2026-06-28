# Prisma Schema Knowledge Base

This document summarizes the Prisma schema and explains what each model/table is used for, key fields, relations, and important database mappings.

## Project Database Setup

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- Database provider: PostgreSQL
- Connection env variable: `DATABASE_URL`
- Prisma client generator: `prisma-client-js`

## Important Table Mapping

The Prisma model `SuperHelperLead` maps to the actual database table:

```prisma
@@map("superHelperLead")
```

So in Supabase SQL, the table name is:

```sql
"superHelperLead"
```

Example:

```sql
select count(*) from "superHelperLead";
```

## Main Business Areas

The schema is organized around these areas:

- Assistants/helpers: `assistant`, `assistantWorkDetail`, `assistantWorkingLocation`, `rating`
- Employers/customers: `employee`
- Employer-assistant interactions: `assistantShortList`, `assistantContactList`, `employerChatList`
- Reviews and testimonials: `reviews`, `testimonial`
- Work categories and preferences: `workCategory`, `assistantWorkSubCategory`, `additionalDetail`, `workTime`, `questionList`
- Location data: `workLocation`, `cityList`
- Packages, orders, payments, offers: `servicePackage`, `orderGenerated`, `paymentDetails`, `offer`
- Verification flows: `criminalVerification`, `employmentVerification`
- Super helper leads: `SuperHelperLead`

## Models

### `test`

Simple test table.

Key fields:

- `id`: Primary key
- `email`: Required email
- `name`: Optional name
- `created_at`: Creation timestamp

### `employee`

Represents an employer/customer account.

Key fields:

- `id`: Primary key
- `email`: Optional email
- `name`: Required name
- `mobile`: Unique mobile number
- `password`: Default password field
- `encrypted_password`: Default encrypted password field
- `created_at`: Creation timestamp
- `updated_at`: Auto-updated timestamp

Relations:

- `reviews`: Reviews written by this employee
- `shortListProfile`: Assistants shortlisted by this employee
- `assistantContactList`: Assistants contacted by this employee
- `employerChatList`: Chat history with assistants

### `assistant`

Represents a helper/assistant profile.

Key fields:

- `id`: Primary key
- `name`: Optional name
- `mobile`: Unique mobile number
- `email`: Optional email
- `pincode`, `state`, `area`, `flatno`, `locality`, `city`: Address fields
- `coordinates`: JSON location data
- `age`, `birth_year`, `gender`: Personal details
- `disabled`: Whether profile is disabled
- `profile_picture_url`, `aadhar_picture_url`, `pan_card_url`: Document/image URLs
- Verification flags: `aadhaar_verification`, `pan_verification`, `criminal_verification`
- Document flags: `profile_picture`, `aadhaar_picture`, `passport_picture`, `covid_vaccine`
- `punctual`: Numeric punctuality score
- `work_out_of_india`: Whether willing to work outside India
- `about_assistant`: Profile description
- `whatsap`: WhatsApp availability flag
- `status`: Profile approval status, defaults to `PENDING`
- `created_at`, `updated_at`: Timestamps

Relations:

- `rating`: One-to-one rating record
- `reviews`: Reviews for this assistant
- `assistantWorkDetail`: One-to-one work details
- `assistantWorkLocation`: One-to-one work location preference
- `shortListByEmployer`: Employers who shortlisted this assistant
- `assistantContactList`: Employers who contacted this assistant
- `employerChatList`: Employer chat history

### `assistantShortList`

Join table for employers shortlisting assistants.

Fields:

- `assitant_id`: Assistant ID
- `employee_id`: Employee/employer ID
- `created_at`, `updated_at`: Timestamps

Relations:

- Links `assistant` and `employee`

Primary key:

```prisma
@@id([assitant_id, employee_id])
```

Note: Field name is spelled `assitant_id` in the schema.

### `assistantContactList`

Join table for employers contacting assistants.

Fields:

- `assistant_id`: Assistant ID
- `employee_id`: Employee/employer ID
- `contact_status`: Contact status
- `employer_comment`: Employer-side notes
- `admin_comment`: Admin notes
- `profile_added_by`: Who added the profile
- `employer_review`: Employer review text
- `hiring_status`: Hiring status
- `created_at`, `updated_at`: Timestamps

Primary key:

```prisma
@@id([assistant_id, employee_id])
```

### `employerChatList`

Join table for chat history between employers and assistants.

Fields:

- `assistant_id`: Assistant ID
- `employee_id`: Employee/employer ID
- `chat_histoy`: Chat history text
- `created_at`, `updated_at`: Timestamps

Primary key:

```prisma
@@id([assistant_id, employee_id])
```

Note: Field name is spelled `chat_histoy` in the schema.

### `rating`

One-to-one rating/checklist record for an assistant.

Fields:

- `id`: Primary key
- `is_aadhar_verified`: Aadhaar verification score/flag
- `is_profile_picture`: Profile picture score/flag
- `is_covid_vaccinate`: Covid vaccination score/flag
- `is_punctual`: Punctuality score/flag
- `assistant_id`: Unique assistant ID
- `created_at`, `updated_at`: Timestamps

Relation:

- Belongs to one `assistant`

### `testimonial`

Stores testimonials displayed in the app.

Fields:

- `id`: Primary key
- `name`: Optional person name
- `title`: Optional title
- `description`: Optional testimonial text
- `rating`: Optional rating value
- `is_active_testimonial`: Active flag
- `created_at`, `updated_at`: Timestamps

### `workCategory`

Stores high-level work categories.

Fields:

- `id`: Primary key
- `name`: English name
- `name_hindi`: Hindi name
- `is_active_work_category`: Active flag
- `created_at`, `updated_at`: Timestamps

Relations:

- `assistant_work_sub_category`: Subcategories under this category

### `assistantWorkSubCategory`

Stores subcategories under a work category.

Fields:

- `id`: Primary key
- `work_sub_category_name`: English subcategory name
- `work_sub_category_name_hindi`: Hindi subcategory name
- `work_category_id`: Parent work category ID
- `active`: Active flag
- `created_at`, `updated_at`: Timestamps

Relation:

- Belongs to `workCategory`

### `workTime`

Stores work timing options.

Fields:

- `id`: Primary key
- `name`: English name
- `name_hindi`: Hindi name
- `is_active_work_time`: Active flag
- `created_at`, `updated_at`: Timestamps

### `reviews`

Stores reviews for assistants written by employees.

Fields:

- `id`: Primary key
- `comment`: Review comment
- `assistant_id`: Assistant ID
- `employee_id`: Employee/employer ID
- `active_review`: Active flag
- `created_at`: Creation timestamp

Relations:

- Belongs to `assistant`
- Belongs to `employee`

### `additionalDetail`

Stores configurable options/details for assistant preferences and categories.

Fields:

- `id`: Primary key
- `name`: English name
- `name_hindi`: Hindi name
- `type`: `assistantCategory` enum
- `work_category_id`: Optional work category reference
- `is_active`: Active flag
- `preference`: Sorting/preference number
- `created_at`, `updated_at`: Timestamps

### `workLocation`

Stores serviceable work locations.

Fields:

- `id`: Primary key
- `pincode`: Pincode
- `area`: Area name
- `city`: City
- `state`: `IndianState` enum

### `assistantWorkingLocation`

Stores assistant work location preference.

Fields:

- `id`: Primary key
- `assistant_work_location`: Location text
- `assistant_work_preference`: `locationPreference` enum
- `assistant_id`: Unique assistant ID
- `created_at`, `updated_at`: Timestamps

Relation:

- One-to-one with `assistant`

### `assistantWorkDetail`

Stores detailed work preferences and experience for an assistant.

Key fields:

- `id`: Primary key
- `assistant_id`: Unique assistant ID
- `assistant_work_category`: Work category
- `assistant_work_timing`: Work timing
- `assistant_gender`: Gender preference
- `assistant_language`: Language preference
- `assistant_work_abroad`: Willing to work abroad
- `assistant_work_japa`: Japa work preference
- `assistant_age_range`: Age range
- `assistant_work_cook`: Cooking work
- `assistant_work_cuisine`: Cuisine
- `assistant_work_child_age`: Child age preference
- `assistant_education`: Education
- `assistant_paitent_work`: Patient work
- `assistant_maid_work`: Maid work
- `assistant_cook_chef_work`: Cook/chef work
- `assistant_baby_sitter`: Babysitter work
- `assistant_work_exp_years`: Experience years
- `assissant_work_exp_details`: Experience details
- `assistant_alternate_number`: Alternate number
- `assistant_parent_elder_care`: Parent/elder care
- `assistant_paitent_care`: Patient care
- `assistant_driving_detail`: Driving details
- `assistant_all_detail`: Combined details
- `assistant_teaching`: Teaching
- `assistant_teaching_subject`: Teaching subject
- `assistant_pet_care`: Pet care flag
- `created_at`, `updated_at`: Timestamps

Relation:

- One-to-one with `assistant`

Notes:

- `assistant_paitent_work` and `assistant_paitent_care` use the spelling `paitent` in the schema.
- `assissant_work_exp_details` uses the spelling `assissant` in the schema.

### `servicePackage`

Stores employer service packages.

Fields:

- `id`: Primary key
- `package_name`: Package name
- `package_price`: Base price
- `package_gst_percentage`: GST percentage
- `package_validity_days`: Validity period
- `package_active`: Active flag
- `package_created_at`, `package_updated_at`: Timestamps

### `orderGenerated`

Stores generated package orders.

Fields:

- `id`: Primary key
- `order_id`: Unique order ID
- `employee_id`: Employee/employer ID
- `order_package_id`: Package ID
- `order_package_name`: Package name snapshot
- `order_package_price`: Package price snapshot
- `order_package_gst`: GST snapshot
- `order_package_created_at`: Creation timestamp
- `coupon_used`: Optional coupon
- `refferal_point`: Optional referral points
- `value_of_id`: Optional value field

Note: Field name is spelled `refferal_point` in the schema.

### `paymentDetails`

Stores payment and Razorpay details.

Key fields:

- `id`: Primary key
- `payment_order_id`: Unique payment order ID
- `employer_id`: Employer ID
- `payment_status`: Payment status
- `original_payment_price`: Original price
- `package_id`: Package ID
- `payment_type`: Payment type
- `payment_gst`: GST amount
- `payment_total_ammount`: Total amount
- `payment_ammount_without_gst`: Amount without GST
- `payment_ammount_with_offer`: Amount after offer
- `offer_taken`: Offer ID/value
- `payment_ammount`: Paid amount
- `is_replacement_activate`: Replacement activation flag
- `contact_take`: Number of contacts used
- `payment_initated_date`: Payment initiated date
- `payment_expiry_date`: Payment expiry date
- Razorpay fields: `rzp_payment_id`, `rzp_order_id`, `rzp_signature`, `rzp_entity`, `rzp_ammount_in_paisa`, `rzp_currency`, `rzp_status`, `rzp_method`, `rzp_payment_description`, `rzp_notes`, `rzp_fees_in_paisa`, `rzp_tax_in_paisa`, `rzp_acquirer_data`, `rzp_created_at`
- `metadata`: Optional metadata
- `employer_mobile`: Optional employer mobile
- `created_at`, `updated_at`: Timestamps

Note: Several fields use the spelling `ammount` and `initated` in the schema.

### `offer`

Stores coupon/offer configuration.

Fields:

- `id`: Primary key
- `offer_name`: Offer display name
- `offer_coupon_name`: Coupon code/name
- `offer_type`: `OfferType` enum
- `offer_valid_for_work`: Applicable work type
- `offer_ammount`: Offer amount/value
- `is_offer_active`: Active flag
- `created_by`: Creation timestamp
- `updated_at`: Auto-updated timestamp

### `criminalVerification`

Stores criminal verification requests.

Fields:

- `id`: Primary key
- `assistant_name`: Assistant name
- `assitant_mobile_number`: Assistant mobile number
- `order_id`: Optional order ID
- `verification_type`: Verification type
- `is_profile_exist`: Whether assistant profile exists
- `verification_document_type`: Document type
- `verification_number`: Optional document number
- `reference_number`: Optional reference number
- `verification_string`: Optional verification response/string
- `fatherName`: Father name
- `address`: Address
- `dob`: Date of birth text
- `employer_mobile`: Employer mobile
- `test`: Optional test field
- `is_paid`: Payment flag
- `created_at`, `updated_at`: Timestamps

Note: Field name is spelled `assitant_mobile_number` in the schema.

### `employmentVerification`

Stores previous employment verification requests.

Fields:

- `id`: Primary key
- `assistant_name`: Assistant name
- `order_id`: Optional order ID
- `assistant_mobile`: Assistant mobile
- `previous_employer_name`: Previous employer name
- `previous_employer_number`: Previous employer number
- `working_time`: Working time
- `reference_number`: Optional reference number
- `is_paid`: Payment flag
- `dateText`: Optional date text
- `employerMobile`: Optional employer mobile
- `created_at`, `updated_at`: Timestamps

### `questionList`

Stores dynamic form questions.

Fields:

- `id`: Primary key
- `question`: English question
- `name`: Optional internal name
- `question_hindi`: Hindi question
- `question_type`: Numeric question type
- `placeholder`: Optional placeholder
- `selct_type`: Select mode, for example single or multiple
- `option_type`: `assistantCategory` enum
- `default_option`: Optional default option
- `is_active_question`: Active flag
- `created_at`, `updated_at`: Timestamps

Note: Field name is spelled `selct_type` in the schema.

### `cityList`

Stores supported cities.

Fields:

- `id`: Primary key
- `city_name`: City name
- `is_active_city`: Active flag
- `created_at`, `updated_at`: Timestamps

### `SuperHelperLead`

Stores leads submitted by helpers or collected by admin.

Actual database table:

```sql
"superHelperLead"
```

Prisma model:

```prisma
model SuperHelperLead {
  ...
  @@map("superHelperLead")
}
```

Fields:

- `id`: Primary key
- `name`: Optional lead name
- `phone_number`: Unique phone number
- `service_interest`: Optional service interest
- `address`: Optional address
- `pincode`: Optional pincode
- `work_category`: Optional work category
- `work_timing`: Optional work timing
- `gender`: Optional gender
- `source`: Optional lead source
- `status`: Lead status string, defaults to `NEW`
- `notes`: Optional admin notes
- `last_contacted_at`: Last contact timestamp
- `reply_received_at`: Reply received timestamp
- `agreed_at`: Agreement timestamp
- `registered_assistant_id`: Optional linked assistant ID
- `created_at`: Creation timestamp
- `updated_at`: Auto-updated timestamp

Indexes:

```prisma
@@index([status, created_at])
@@index([pincode])
```

Common SQL:

```sql
select * from "superHelperLead" order by created_at desc;
select count(*) from "superHelperLead";
update "superHelperLead" set source = 'register-helper-for-jobs';
```

Lead statuses used by the admin app:

- `NEW`
- `WHATSAPP_SENT`
- `REPLIED`
- `CALL_TRIED`
- `AGREED_TO_REGISTER`
- `REGISTERED`
- `NOT_INTERESTED`
- `NOT_REACHABLE`
- `WRONG_NUMBER`

## Enums

### `Gender`

Values:

- `MALE`
- `FEMALE`
- `OTHER`
- `HELLO`

### `ProfileStatus`

Values:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `BLOCKED`

### `assistantCategory`

Used for dynamic assistant options/questions.

Values:

- `GENDER`
- `AGE_CATEGORY`
- `LANGUAGE`
- `CHILD_AGE`
- `JAPA_WORK`
- `COOKING`
- `COOK_IN`
- `EDUCATION`
- `PAITENT_CARE`
- `ELDER_CARE`
- `DRIVER`
- `MAID_GENERAL_WORK`
- `CHILD_CARE`
- `CARE_GIVER`
- `NANNY_WORK`
- `PAITENT_TYPE_CARE`
- `TEACHING`
- `SUBJECTS`

### `IndianState`

Values:

- `ANDHRA_PRADESH`
- `ARUNACHAL_PRADESH`
- `ASSAM`
- `BIHAR`
- `CHHATTISGARH`
- `GOA`
- `GUJARAT`
- `HARYANA`
- `HIMACHAL_PRADESH`
- `JHARKHAND`
- `KARNATAKA`
- `KERALA`
- `MADHYA_PRADESH`
- `MAHARASHTRA`
- `MANIPUR`
- `MEGHALAYA`
- `MIZORAM`
- `NAGALAND`
- `ODISHA`
- `PUNJAB`
- `RAJASTHAN`
- `SIKKIM`
- `TAMIL_NADU`
- `TELANGANA`
- `TRIPURA`
- `UTTAR_PRADESH`
- `UTTARAKHAND`
- `WEST_BENGAL`
- `DELHI`

### `locationPreference`

Values:

- `ANY_WHERE_IN_CITY`
- `ANY_WHERE_IN_INDIA`

### `OfferType`

Values:

- `PERCENTAGE`
- `AMMOUNT`

## Relationship Summary

- `employee` has many `reviews`
- `assistant` has many `reviews`
- `employee` and `assistant` have many-to-many relationships through:
  - `assistantShortList`
  - `assistantContactList`
  - `employerChatList`
- `assistant` has one `rating`
- `assistant` has one `assistantWorkDetail`
- `assistant` has one `assistantWorkingLocation`
- `workCategory` has many `assistantWorkSubCategory`

## Naming Notes

Some schema names contain spelling inconsistencies. Keep these exact names in Prisma and SQL unless a migration is planned:

- `assitant_id`
- `chat_histoy`
- `paitent`
- `assissant_work_exp_details`
- `refferal_point`
- `ammount`
- `payment_initated_date`
- `assitant_mobile_number`
- `selct_type`

Changing these names directly can break existing code or database queries. Use Prisma migrations if renaming is needed.
