--
-- PostgreSQL database dump
--

\restrict f4aJ9RiZgMSvFcJKr1PB5BHv1hBRLXvK3Yv9fVeCapZiycg4uWUpKYhXXeTHZho

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
-- Name: song_list; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_list (
    song_id integer NOT NULL,
    song_title character varying(100) NOT NULL,
    artist_id integer NOT NULL
);


--
-- Name: song_list_song_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.song_list_song_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: song_list_song_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.song_list_song_id_seq OWNED BY public.song_list.song_id;


--
-- Name: song_list song_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_list ALTER COLUMN song_id SET DEFAULT nextval('public.song_list_song_id_seq'::regclass);


--
-- Name: song_list song_list_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_list
    ADD CONSTRAINT song_list_pkey PRIMARY KEY (song_id);


--
-- Name: song_list song_list_unique_row; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_list
    ADD CONSTRAINT song_list_unique_row UNIQUE (song_title, artist_id);


--
-- PostgreSQL database dump complete
--

\unrestrict f4aJ9RiZgMSvFcJKr1PB5BHv1hBRLXvK3Yv9fVeCapZiycg4uWUpKYhXXeTHZho

