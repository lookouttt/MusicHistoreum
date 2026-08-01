--
-- PostgreSQL database dump
--

\restrict 57yVJFeqK5a5Amdvzw7bHBidBa1rhOqQKUv6Zar3U1wkbCmSTRgWmvEYWSeBCfG

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
-- Name: chart_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_entries (
    entry_id integer NOT NULL,
    source_id integer NOT NULL,
    rank integer NOT NULL,
    chart_id integer NOT NULL
);


--
-- Name: chart_entries_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chart_entries_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chart_entries_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chart_entries_entry_id_seq OWNED BY public.chart_entries.entry_id;


--
-- Name: chart_entries entry_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_entries ALTER COLUMN entry_id SET DEFAULT nextval('public.chart_entries_entry_id_seq'::regclass);


--
-- Name: chart_entries chart_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_entries
    ADD CONSTRAINT chart_entries_pkey PRIMARY KEY (entry_id);


--
-- Name: chart_entries chart_entries_unique_row; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_entries
    ADD CONSTRAINT chart_entries_unique_row UNIQUE (source_id, chart_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 57yVJFeqK5a5Amdvzw7bHBidBa1rhOqQKUv6Zar3U1wkbCmSTRgWmvEYWSeBCfG

