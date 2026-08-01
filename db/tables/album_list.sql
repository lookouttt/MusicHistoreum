--
-- PostgreSQL database dump
--

\restrict Kxu7g0vf50tJZlxCkycUcXfBL7DQTid1Q2XC3JuXvcO59PDubrUBx0W2M1yxWzD

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
-- Name: album_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.album_list (
    album_id integer NOT NULL,
    album_title character varying(100) NOT NULL,
    artist_id integer NOT NULL
);


--
-- Name: album_list_album_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.album_list_album_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: album_list_album_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.album_list_album_id_seq OWNED BY public.album_list.album_id;


--
-- Name: album_list album_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.album_list ALTER COLUMN album_id SET DEFAULT nextval('public.album_list_album_id_seq'::regclass);


--
-- Name: album_list album_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.album_list
    ADD CONSTRAINT album_list_pkey PRIMARY KEY (album_id);


--
-- Name: album_list album_list_unique_row; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.album_list
    ADD CONSTRAINT album_list_unique_row UNIQUE (album_title, artist_id);


--
-- PostgreSQL database dump complete
--

\unrestrict Kxu7g0vf50tJZlxCkycUcXfBL7DQTid1Q2XC3JuXvcO59PDubrUBx0W2M1yxWzD

