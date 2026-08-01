--
-- PostgreSQL database dump
--

\restrict viPLHhR46QBYDID83wO9P4NJcmQhpy8bJ8eLIicFG1WA4PSYkqUyQ95ufRpB52H

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
-- Name: artist_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artist_list (
    artist_id integer NOT NULL,
    artist_name character varying(150) NOT NULL,
    sort_name character varying(150),
    multi_artist integer[],
    aka integer
);


--
-- Name: artist_list_artist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artist_list_artist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artist_list_artist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artist_list_artist_id_seq OWNED BY public.artist_list.artist_id;


--
-- Name: artist_list artist_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_list ALTER COLUMN artist_id SET DEFAULT nextval('public.artist_list_artist_id_seq'::regclass);


--
-- Name: artist_list artist_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artist_list
    ADD CONSTRAINT artist_list_pkey PRIMARY KEY (artist_id);


--
-- PostgreSQL database dump complete
--

\unrestrict viPLHhR46QBYDID83wO9P4NJcmQhpy8bJ8eLIicFG1WA4PSYkqUyQ95ufRpB52H

