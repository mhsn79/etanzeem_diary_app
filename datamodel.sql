-- public."Activities" definition

-- Drop table

-- DROP TABLE public."Activities";

CREATE TABLE public."Activities" (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	activity_date_and_time timestamp NULL,
	location_coordinates varchar(255) NULL,
	activity_details text NULL,
	activity_type int4 NULL,
	"location" varchar(255) NULL,
	attendance int4 NULL,
	activity_summary text NULL,
	report_month int4 DEFAULT 1 NULL,
	report_year int4 DEFAULT 2025 NULL,
	tanzeemi_unit int4 NULL,
	CONSTRAINT "Activities_pkey" PRIMARY KEY (id)
);


-- public."Activity_Type" definition

-- Drop table

-- DROP TABLE public."Activity_Type";

CREATE TABLE public."Activity_Type" (
	id serial4 NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"Name" varchar(255) NULL,
	"Level_id" int4 NULL,
	category varchar(255) DEFAULT 'event'::character varying NULL,
	"target" int4 NULL,
	target_duration varchar(255) DEFAULT 'monthly'::character varying NULL,
	"Name_plural" varchar(255) NULL,
	CONSTRAINT "Activity_Type_pkey" PRIMARY KEY (id),
	CONSTRAINT activity_type_name_unique UNIQUE ("Name")
);


-- public."Person" definition

-- Drop table

-- DROP TABLE public."Person";

CREATE TABLE public."Person" (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"Name" varchar(255) NULL,
	"Father_Name" varchar(255) NULL,
	"Date_of_birth" timestamp NULL,
	"Email" varchar(255) NULL,
	"Address" text NULL,
	"CNIC" varchar(255) NULL,
	"Gender" varchar(255) DEFAULT 'm'::character varying NULL,
	"User_id" uuid NULL,
	"Profession" varchar(255) DEFAULT NULL::character varying NULL,
	"Education" varchar(255) DEFAULT NULL::character varying NULL,
	"Tanzeemi_Unit" int4 NULL,
	"Phone_Number" varchar(255) NULL,
	"Rukn_No" int4 NULL,
	"Rukinat_Date" timestamp NULL,
	"Transfer_from" varchar(255) NULL,
	"Transfet_to" varchar(255) NULL,
	additional_phones json NULL,
	contact_type int4 DEFAULT 4 NULL,
	notes text NULL,
	archived_at timestamp NULL,
	"Name_en" varchar(255) NULL,
	CONSTRAINT "Person_pkey" PRIMARY KEY (id),
	CONSTRAINT person_rukn_no_unique UNIQUE ("Rukn_No")
);


-- public."Person_files" definition

-- Drop table

-- DROP TABLE public."Person_files";

CREATE TABLE public."Person_files" (
	id serial4 NOT NULL,
	"Person_id" int4 NULL,
	directus_files_id uuid NULL,
	CONSTRAINT "Person_files_pkey" PRIMARY KEY (id)
);


-- public."Rukn_Update" definition

-- Drop table

-- DROP TABLE public."Rukn_Update";

CREATE TABLE public."Rukn_Update" (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	date_of_birth varchar(255) NULL,
	"Name" varchar(255) NULL,
	"Father_Name" varchar(255) NULL,
	"Email" varchar(255) NULL,
	"Address" varchar(255) NULL,
	"Profession" varchar(255) NULL,
	"Education" varchar(255) NULL,
	"Additional_Phones" varchar(255) NULL,
	contact_id int4 NULL,
	"Phone_Number" varchar(255) NULL,
	CONSTRAINT "Rukn_Update_pkey" PRIMARY KEY (id)
);


-- public."Strength_Records" definition

-- Drop table

-- DROP TABLE public."Strength_Records";

CREATE TABLE public."Strength_Records" (
	id serial4 NOT NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"Tanzeemi_Unit" int4 NULL,
	"Type" int4 NULL,
	plus_value int4 DEFAULT 0 NOT NULL,     -- Monthly increase (اضافہ)
	minus_value int4 DEFAULT 0 NOT NULL,    -- Monthly decrease (کمی)
	previous_total int4 DEFAULT 0 NOT NULL, -- Total at start of month (carried forward)
	new_total int4 DEFAULT 0 NOT NULL,      -- = previous_total + plus_value - minus_value
	report_year int4 NOT NULL,
	report_month int4 NOT NULL,             -- 1-12
	notes text NULL,                        -- Optional comments/notes
	CONSTRAINT "Strength_Records_pkey" PRIMARY KEY (id),
	CONSTRAINT strength_records_unique_month UNIQUE ("Tanzeemi_Unit", "Type", report_year, report_month)
);
CREATE INDEX strength_records_tanzeemi_unit_index ON public."Strength_Records" USING btree ("Tanzeemi_Unit");
CREATE INDEX strength_records_type_index ON public."Strength_Records" USING btree ("Type");
CREATE INDEX strength_records_year_month_index ON public."Strength_Records" USING btree (report_year, report_month);


-- public."Strength_Type" definition

-- Drop table

-- DROP TABLE public."Strength_Type";

CREATE TABLE public."Strength_Type" (
	id serial4 NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"Name_Singular" varchar(255) DEFAULT NULL::character varying NOT NULL,
	"Name_Plural" varchar(255) NULL,
	"Gender" varchar(255) DEFAULT 'M'::character varying NULL,
	"Category" varchar(255) DEFAULT 'workforce'::character varying NOT NULL,
	"Reporting_Unit_Level" int4 NULL,
	CONSTRAINT "Strength_Type_pkey" PRIMARY KEY (id)
);


-- public."Tanzeemi_Level" definition

-- Drop table

-- DROP TABLE public."Tanzeemi_Level";

CREATE TABLE public."Tanzeemi_Level" (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"Name" varchar(255) NOT NULL,
	"Nazim_Label" varchar(255) DEFAULT 'ناظم'::character varying NULL,
	CONSTRAINT "Tanzeemi_Level_pkey" PRIMARY KEY (id),
	CONSTRAINT tanzeemi_level_name_unique UNIQUE ("Name")
);


-- public."Tanzeemi_Unit" definition

-- Drop table

-- DROP TABLE public."Tanzeemi_Unit";

CREATE TABLE public."Tanzeemi_Unit" (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"Name" varchar(255) NOT NULL,
	"Description" varchar(255) NULL,
	"Level_id" int4 NULL,
	"level" int4 NULL,
	"Parent_id" int4 NULL,
	"Nazim_id" int4 NULL,
	user_id uuid NULL,
	CONSTRAINT "Tanzeemi_Unit_pkey" PRIMARY KEY (id),
	CONSTRAINT tanzeemi_unit_name_unique UNIQUE ("Name"),
	CONSTRAINT tanzeemi_unit_nazim_id_unique UNIQUE ("Nazim_id")
);
CREATE INDEX tanzeemi_unit_name_index ON public."Tanzeemi_Unit" USING btree ("Name");


-- public.contact_type definition

-- Drop table

-- DROP TABLE public.contact_type;

CREATE TABLE public.contact_type (
	id serial4 NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	"type" varchar(255) NULL,
	label_singular varchar(255) NULL,
	label_plural varchar(255) NULL,
	CONSTRAINT contact_type_pkey PRIMARY KEY (id)
);


-- public.directus_users definition

-- Drop table

-- DROP TABLE public.directus_users;

CREATE TABLE public.directus_users (
	id uuid NOT NULL,
	first_name varchar(50) NULL,
	last_name varchar(50) NULL,
	email varchar(128) NULL,
	"password" varchar(255) NULL,
	"location" varchar(255) NULL,
	title varchar(50) NULL,
	description text NULL,
	tags json NULL,
	avatar uuid NULL,
	"language" varchar(255) DEFAULT NULL::character varying NULL,
	tfa_secret varchar(255) NULL,
	status varchar(16) DEFAULT 'active'::character varying NOT NULL,
	"role" uuid NULL,
	"token" varchar(255) NULL,
	last_access timestamptz NULL,
	last_page varchar(255) NULL,
	provider varchar(128) DEFAULT 'default'::character varying NOT NULL,
	external_identifier varchar(255) NULL,
	auth_data json NULL,
	email_notifications bool DEFAULT true NULL,
	appearance varchar(255) NULL,
	theme_dark varchar(255) NULL,
	theme_light varchar(255) NULL,
	theme_light_overrides json NULL,
	theme_dark_overrides json NULL,
	CONSTRAINT directus_users_email_unique UNIQUE (email),
	CONSTRAINT directus_users_external_identifier_unique UNIQUE (external_identifier),
	CONSTRAINT directus_users_pkey PRIMARY KEY (id),
	CONSTRAINT directus_users_token_unique UNIQUE (token)
);


-- public.report_answers definition

-- Drop table

-- DROP TABLE public.report_answers;

CREATE TABLE public.report_answers (
	id serial4 NOT NULL,
	submission_id int4 NOT NULL,
	number_value int4 NULL,
	string_value varchar(255) NULL,
	question_id int4 NULL,
	text_value text NULL,
	CONSTRAINT report_answers_pkey PRIMARY KEY (id)
);


-- public.report_questions definition

-- Drop table

-- DROP TABLE public.report_questions;

CREATE TABLE public.report_questions (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	section_id int4 NOT NULL,
	question_text text NOT NULL,
	input_type varchar(255) DEFAULT NULL::character varying NOT NULL,
	category varchar(255) DEFAULT 'manual'::character varying NULL,
	highlight bool NULL,
	linked_to_type varchar(255) NULL,
	linked_to_id int4 NULL,
	aggregate_func varchar(255) NULL,
	CONSTRAINT report_questions_pkey PRIMARY KEY (id)
);


-- public.report_sections definition

-- Drop table

-- DROP TABLE public.report_sections;

CREATE TABLE public.report_sections (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	template_id int4 NOT NULL,
	section_label varchar(255) DEFAULT NULL::character varying NOT NULL,
	CONSTRAINT report_sections_pkey PRIMARY KEY (id)
);


-- public.report_templates definition

-- Drop table

-- DROP TABLE public.report_templates;

CREATE TABLE public.report_templates (
	id serial4 NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	unit_level_id int4 NOT NULL,
	report_name varchar(255) DEFAULT NULL::character varying NOT NULL,
	CONSTRAINT report_templates_pkey PRIMARY KEY (id),
	CONSTRAINT report_templates_report_name_unique UNIQUE (report_name)
);


-- public.reports_mgmt definition

-- Drop table

-- DROP TABLE public.reports_mgmt;

CREATE TABLE public.reports_mgmt (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	reporting_start_date date NULL,
	reporting_end_date date NULL,
	extended_days int4 NULL,
	submitted_reports_count int4 NULL,
	"month" int4 NOT NULL,
	"year" int4 DEFAULT 2025 NOT NULL,
	report_template_id int4 NOT NULL,
	CONSTRAINT reports_mgmt_pkey PRIMARY KEY (id)
);


-- public.reports_submissions definition

-- Drop table

-- DROP TABLE public.reports_submissions;

CREATE TABLE public.reports_submissions (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	unit_id int4 NULL,
	template_id int4 NULL,
	mgmt_id int4 NULL,
	CONSTRAINT reports_submissions_pkey PRIMARY KEY (id)
);


-- public.rukun_transfers definition

-- Drop table

-- DROP TABLE public.rukun_transfers;

CREATE TABLE public.rukun_transfers (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	contact_id int4 NULL,
	transfer_type varchar(255) DEFAULT 'local'::character varying NULL,
	transfer_date date NULL,
	local_unit_id int4 NULL,
	city_name varchar(255) NULL,
	reason text NULL,
	CONSTRAINT rukun_transfers_pkey PRIMARY KEY (id)
);


-- public.strength_targets definition

-- Drop table

-- DROP TABLE public.strength_targets;

CREATE TABLE public.strength_targets (
	id serial4 NOT NULL,
	status varchar(255) DEFAULT 'draft'::character varying NOT NULL,
	sort int4 NULL,
	user_created uuid NULL,
	date_created timestamptz NULL,
	user_updated uuid NULL,
	date_updated timestamptz NULL,
	unit int4 NULL,
	"target" int4 NULL,
	target_duration varchar(255) DEFAULT 'monthly'::character varying NULL,
	strength_type int4 NULL,
	CONSTRAINT strength_targets_pkey PRIMARY KEY (id)
);


-- public."Activities" foreign keys

ALTER TABLE public."Activities" ADD CONSTRAINT activities_activity_type_foreign FOREIGN KEY (activity_type) REFERENCES public."Activity_Type"(id);
ALTER TABLE public."Activities" ADD CONSTRAINT activities_tanzeemi_unit_foreign FOREIGN KEY (tanzeemi_unit) REFERENCES public."Tanzeemi_Unit"(id) ON DELETE SET NULL;
ALTER TABLE public."Activities" ADD CONSTRAINT activities_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Activities" ADD CONSTRAINT activities_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Activity_Type" foreign keys

ALTER TABLE public."Activity_Type" ADD CONSTRAINT activity_type_level_id_foreign FOREIGN KEY ("Level_id") REFERENCES public."Tanzeemi_Level"(id) ON DELETE SET NULL;
ALTER TABLE public."Activity_Type" ADD CONSTRAINT activity_type_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Activity_Type" ADD CONSTRAINT activity_type_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Person" foreign keys

ALTER TABLE public."Person" ADD CONSTRAINT person_contact_type_foreign FOREIGN KEY (contact_type) REFERENCES public.contact_type(id) ON DELETE SET DEFAULT;
ALTER TABLE public."Person" ADD CONSTRAINT person_tanzeemi_unit_foreign FOREIGN KEY ("Tanzeemi_Unit") REFERENCES public."Tanzeemi_Unit"(id) ON DELETE SET NULL;
ALTER TABLE public."Person" ADD CONSTRAINT person_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Person" ADD CONSTRAINT person_user_id_foreign FOREIGN KEY ("User_id") REFERENCES public.directus_users(id) ON DELETE SET NULL;
ALTER TABLE public."Person" ADD CONSTRAINT person_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Person_files" foreign keys

ALTER TABLE public."Person_files" ADD CONSTRAINT person_files_directus_files_id_foreign FOREIGN KEY (directus_files_id) REFERENCES public.directus_files(id) ON DELETE SET NULL;
ALTER TABLE public."Person_files" ADD CONSTRAINT person_files_person_id_foreign FOREIGN KEY ("Person_id") REFERENCES public."Person"(id) ON DELETE SET NULL;


-- public."Rukn_Update" foreign keys

ALTER TABLE public."Rukn_Update" ADD CONSTRAINT rukn_update_contact_id_foreign FOREIGN KEY (contact_id) REFERENCES public."Person"(id) ON DELETE SET NULL;
ALTER TABLE public."Rukn_Update" ADD CONSTRAINT rukn_update_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Rukn_Update" ADD CONSTRAINT rukn_update_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Strength_Records" foreign keys

ALTER TABLE public."Strength_Records" ADD CONSTRAINT strength_records_tanzeemi_unit_foreign FOREIGN KEY ("Tanzeemi_Unit") REFERENCES public."Tanzeemi_Unit"(id) ON DELETE SET NULL;
ALTER TABLE public."Strength_Records" ADD CONSTRAINT strength_records_type_foreign FOREIGN KEY ("Type") REFERENCES public."Strength_Type"(id) ON DELETE SET NULL;
ALTER TABLE public."Strength_Records" ADD CONSTRAINT strength_records_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Strength_Records" ADD CONSTRAINT strength_records_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Strength_Type" foreign keys

ALTER TABLE public."Strength_Type" ADD CONSTRAINT strength_type_reporting_unit_level_foreign FOREIGN KEY ("Reporting_Unit_Level") REFERENCES public."Tanzeemi_Level"(id) ON DELETE SET NULL;
ALTER TABLE public."Strength_Type" ADD CONSTRAINT strength_type_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Strength_Type" ADD CONSTRAINT strength_type_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Tanzeemi_Level" foreign keys

ALTER TABLE public."Tanzeemi_Level" ADD CONSTRAINT tanzeemi_level_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Tanzeemi_Level" ADD CONSTRAINT tanzeemi_level_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public."Tanzeemi_Unit" foreign keys

ALTER TABLE public."Tanzeemi_Unit" ADD CONSTRAINT tanzeemi_unit_level_id_foreign FOREIGN KEY ("Level_id") REFERENCES public."Tanzeemi_Level"(id) ON DELETE SET NULL;
ALTER TABLE public."Tanzeemi_Unit" ADD CONSTRAINT tanzeemi_unit_nazim_id_foreign FOREIGN KEY ("Nazim_id") REFERENCES public."Person"(id) ON DELETE SET NULL;
ALTER TABLE public."Tanzeemi_Unit" ADD CONSTRAINT tanzeemi_unit_parent_id_foreign FOREIGN KEY ("Parent_id") REFERENCES public."Tanzeemi_Unit"(id);
ALTER TABLE public."Tanzeemi_Unit" ADD CONSTRAINT tanzeemi_unit_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public."Tanzeemi_Unit" ADD CONSTRAINT tanzeemi_unit_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.directus_users(id) ON DELETE SET NULL;
ALTER TABLE public."Tanzeemi_Unit" ADD CONSTRAINT tanzeemi_unit_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.contact_type foreign keys

ALTER TABLE public.contact_type ADD CONSTRAINT contact_type_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.contact_type ADD CONSTRAINT contact_type_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.directus_users foreign keys

ALTER TABLE public.directus_users ADD CONSTRAINT directus_users_role_foreign FOREIGN KEY ("role") REFERENCES public.directus_roles(id) ON DELETE SET NULL;


-- public.report_answers foreign keys

ALTER TABLE public.report_answers ADD CONSTRAINT report_answers_question_id_foreign FOREIGN KEY (question_id) REFERENCES public.report_questions(id) ON DELETE SET NULL;
ALTER TABLE public.report_answers ADD CONSTRAINT report_answers_submission_id_foreign FOREIGN KEY (submission_id) REFERENCES public.reports_submissions(id);


-- public.report_questions foreign keys

ALTER TABLE public.report_questions ADD CONSTRAINT report_questions_section_id_foreign FOREIGN KEY (section_id) REFERENCES public.report_sections(id);
ALTER TABLE public.report_questions ADD CONSTRAINT report_questions_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.report_questions ADD CONSTRAINT report_questions_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.report_sections foreign keys

ALTER TABLE public.report_sections ADD CONSTRAINT report_sections_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.report_templates(id);
ALTER TABLE public.report_sections ADD CONSTRAINT report_sections_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.report_sections ADD CONSTRAINT report_sections_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.report_templates foreign keys

ALTER TABLE public.report_templates ADD CONSTRAINT report_templates_unit_level_id_foreign FOREIGN KEY (unit_level_id) REFERENCES public."Tanzeemi_Level"(id);
ALTER TABLE public.report_templates ADD CONSTRAINT report_templates_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.report_templates ADD CONSTRAINT report_templates_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.reports_mgmt foreign keys

ALTER TABLE public.reports_mgmt ADD CONSTRAINT reports_mgmt_report_template_id_foreign FOREIGN KEY (report_template_id) REFERENCES public.report_templates(id);
ALTER TABLE public.reports_mgmt ADD CONSTRAINT reports_mgmt_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.reports_mgmt ADD CONSTRAINT reports_mgmt_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.reports_submissions foreign keys

ALTER TABLE public.reports_submissions ADD CONSTRAINT reports_submissions_mgmt_id_foreign FOREIGN KEY (mgmt_id) REFERENCES public.reports_mgmt(id);
ALTER TABLE public.reports_submissions ADD CONSTRAINT reports_submissions_template_id_foreign FOREIGN KEY (template_id) REFERENCES public.report_templates(id);
ALTER TABLE public.reports_submissions ADD CONSTRAINT reports_submissions_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES public."Tanzeemi_Unit"(id);
ALTER TABLE public.reports_submissions ADD CONSTRAINT reports_submissions_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.reports_submissions ADD CONSTRAINT reports_submissions_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.rukun_transfers foreign keys

ALTER TABLE public.rukun_transfers ADD CONSTRAINT rukun_transfers_contact_id_foreign FOREIGN KEY (contact_id) REFERENCES public."Person"(id) ON DELETE SET NULL;
ALTER TABLE public.rukun_transfers ADD CONSTRAINT rukun_transfers_local_unit_id_foreign FOREIGN KEY (local_unit_id) REFERENCES public."Tanzeemi_Unit"(id) ON DELETE SET NULL;
ALTER TABLE public.rukun_transfers ADD CONSTRAINT rukun_transfers_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.rukun_transfers ADD CONSTRAINT rukun_transfers_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);


-- public.strength_targets foreign keys

ALTER TABLE public.strength_targets ADD CONSTRAINT strength_targets_strength_type_foreign FOREIGN KEY (strength_type) REFERENCES public."Strength_Type"(id) ON DELETE SET NULL;
ALTER TABLE public.strength_targets ADD CONSTRAINT strength_targets_unit_foreign FOREIGN KEY (unit) REFERENCES public."Tanzeemi_Unit"(id) ON DELETE SET NULL;
ALTER TABLE public.strength_targets ADD CONSTRAINT strength_targets_user_created_foreign FOREIGN KEY (user_created) REFERENCES public.directus_users(id);
ALTER TABLE public.strength_targets ADD CONSTRAINT strength_targets_user_updated_foreign FOREIGN KEY (user_updated) REFERENCES public.directus_users(id);
