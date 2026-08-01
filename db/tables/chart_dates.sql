--
-- PostgreSQL database dump
--

\restrict 2eHLnTAcQASnOBAeBw9eMf0fm4mEAycoP6HnWfhgFTqd1hPPqXdvHx49CgaVuX2

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
-- Name: chart_dates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_dates (
    chart_date_id integer NOT NULL,
    chart_id integer NOT NULL,
    chart_date date NOT NULL,
    item_count integer
);


--
-- Name: chart_dates_chart_date_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chart_dates_chart_date_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chart_dates_chart_date_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chart_dates_chart_date_id_seq OWNED BY public.chart_dates.chart_date_id;


--
-- Name: chart_dates chart_date_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_dates ALTER COLUMN chart_date_id SET DEFAULT nextval('public.chart_dates_chart_date_id_seq'::regclass);


--
-- Name: chart_dates chart_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_dates
    ADD CONSTRAINT chart_dates_pkey PRIMARY KEY (chart_date_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2eHLnTAcQASnOBAeBw9eMf0fm4mEAycoP6HnWfhgFTqd1hPPqXdvHx49CgaVuX2

