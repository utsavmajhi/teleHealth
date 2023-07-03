--------------------------------------------------
--------    DOCTOR
--------------------------------------------------

create table if not exists DOCTOR
(
    doctor_id   varchar (100) not null,
    first_name  varchar(50),
    last_name   varchar(40),
    gender      varchar(1),
    speciality  varchar(100),
    email       varchar(50),
    phone       varchar(20),
    address     varchar(200),
    city        varchar(100),
    state       varchar(100),
    country     varchar(100),
    zip         varchar(20),
    active      boolean,
    created_at    timestamp,
    updated_at    timestamp,
    primary key (doctor_id)
    );
--------------------------------------------------
--------    PATIENT
--------------------------------------------------


create table if not exists PATIENT
(
    patient_id      varchar(100) not null,
    booth_id        varchar(100) not null,
    first_name      varchar(50),
    last_name       varchar(50),
    date_of_birth   date,
    gender          varchar(1),
    email           varchar(100),
    phone_number    varchar(20),
    address         varchar(200),
    city        varchar(100),
    state       varchar(100),
    country     varchar(100),
    zip         varchar(20),
    created_at      timestamp,
    updated_at      timestamp,
    primary key (patient_id,booth_id)
    );
--------------------------------------------------
--------    ADMIN
--------------------------------------------------

create table if not exists ADMIN
(
    user_id         varchar(50) not null,
    first_name      varchar(50),
    last_name       varchar(50),
    email           varchar(100),
    phone_number    varchar(20),
    created_at      timestamp,
    updated_at      timestamp,
    primary key (user_id)
    );

--------------------------------------------------
--------    SUPERVISOR
--------------------------------------------------
create table if not exists SUPERVISOR
(
    supervisor_id   varchar(100) not null,
    first_name      varchar(50),
    last_name       varchar(50),
    email           varchar(100),
    phone_number    varchar(20),
    active          boolean,
    created_at      timestamp,
    updated_at      timestamp,
    primary key (supervisor_id)
    );

--------------------------------------------------
--------    BOOTH
--------------------------------------------------
create table if not exists BOOTH
(
    booth_id        varchar(100) not null,
    name            varchar(50),
    email           varchar(100),
    phone_number    varchar(20),
    active          boolean,
    address         varchar(200),
    city        varchar(100),
    state       varchar(100),
    country     varchar(100),
    zip         varchar(20),
    created_at      timestamp,
    updated_at      timestamp,
    primary key (booth_id)
    );

--------------------------------------------------
--------    BOOTH_SUPERVISOR
--------------------------------------------------
create table if not exists BOOTH_SUPERVISOR
(
    booth_id        varchar(100) not null,
    supervisor_id   varchar(100),
    created_at      timestamp,
    updated_at      timestamp,
    primary key (booth_id)
    );

--------------------------------------------------
--------    BOOTH_DOCTORS
--------------------------------------------------
create table if not exists BOOTH_DOCTORS
(
    booth_id        varchar(100) not null,
    doctor_id       varchar(100) not null,
    created_at      timestamp,
    updated_at      timestamp,
    primary key (booth_id,doctor_id)
    );
--------------------------------------------------
--------    APPOINTMENT
--------------------------------------------------
create table if not exists APPOINTMENT
(
    appointment_id      varchar(100),
    booth_id            varchar(100),
    patient_id          varchar(100),
    doctor_id           varchar(100),
    appointment_date    varchar(100),
    appointment_time    varchar(100),
    duration            varchar(100),
    appointment_type    varchar(100),
    status              varchar(50),
    created_at          timestamp,
    updated_at          timestamp,
    primary key (appointment_id),
    foreign key (booth_id) references BOOTH(booth_id),
    foreign key (patient_id, booth_id) references PATIENT(patient_id, booth_id),
    foreign key (doctor_id) references DOCTOR(doctor_id)
    );

--------------------------------------------------
--------    DRUGS
--------------------------------------------------


create table if not exists DRUGS
(
    appointment_id      varchar(100) not null,
    booth_id            varchar(100) not null,
    active              boolean,
    created_at          timestamp,
    updated_at          timestamp,
    primary key (appointment_id),
    foreign key (booth_id) references BOOTH(booth_id)
    );


--------------------------------------------------
--------    VISITS
--------------------------------------------------

create table if not exists VISITS
(
    visit_id        varchar(100) not null,
    patient_id      varchar(100) not null,
    doctor_id       varchar(100) not null,
    booth_id        varchar (100) not null,
    visit_date      date,
    symptoms        text,
    diagnosis       text,
    prescription    text,
    created_at      timestamp,
    updated_at      timestamp,
    primary key (visit_id),
    foreign key (patient_id, booth_id) references PATIENT(patient_id, booth_id),
    foreign key (doctor_id) references DOCTOR(doctor_id)
    );

--------------------------------------------------
--------    VIDEO_CALLS
--------------------------------------------------


create table if not exists VIDEO_CALLS
(
    call_id         varchar(100) not null,
    visit_id        varchar(100) not null,
    start_time      timestamp,
    end_time        timestamp,
    call_duration   integer,
    recording_url   varchar(200),
    primary key (call_id),
    foreign key (visit_id) references VISITS(visit_id)
    );

