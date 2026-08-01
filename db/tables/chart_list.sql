--
-- PostgreSQL database dump
--

\restrict whcG5s6pcCPZoBXYihKSicIUd4L3PtyNc2jFW9jjCSd0pEbyRRYqZitY4YO1nod

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_table_access_method = heap;

--
-- Name: chart_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_list (
    chart_id integer NOT NULL,
    chart_name character varying(60) NOT NULL,
    first_date date,
    last_date date,
    next_date date,
    chart_type character varying(20),
    included boolean,
    online boolean DEFAULT false NOT NULL
);


--
-- Name: chart_list_chart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chart_list_chart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chart_list_chart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chart_list_chart_id_seq OWNED BY public.chart_list.chart_id;


--
-- Name: chart_list chart_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_list ALTER COLUMN chart_id SET DEFAULT nextval('public.chart_list_chart_id_seq'::regclass);


--
-- Name: chart_list chart_list_chart_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_list
    ADD CONSTRAINT chart_list_chart_name_key UNIQUE (chart_name);


--
-- Name: chart_list chart_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_list
    ADD CONSTRAINT chart_list_pkey PRIMARY KEY (chart_id);


--
-- PostgreSQL database dump complete
--

\unrestrict whcG5s6pcCPZoBXYihKSicIUd4L3PtyNc2jFW9jjCSd0pEbyRRYqZitY4YO1nod

