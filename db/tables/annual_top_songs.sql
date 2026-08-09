--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: annual_top_songs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.annual_top_songs (
    annual_top_songs_id integer NOT NULL,
    chart_id integer NOT NULL,
    chart_name character varying(60) NOT NULL,
    year integer NOT NULL,
    year_rank integer NOT NULL,
    song_id integer NOT NULL,
    song_title character varying(100) NOT NULL,
    artist_id integer NOT NULL,
    artist_name character varying(150) NOT NULL,
    peak integer,
    points integer,
    weeks integer,
    is_year_complete boolean DEFAULT false NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.annual_top_songs OWNER TO postgres;

--
-- Name: annual_top_songs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.annual_top_songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.annual_top_songs_id_seq OWNER TO postgres;

--
-- Name: annual_top_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.annual_top_songs_id_seq OWNED BY public.annual_top_songs.annual_top_songs_id;


--
-- Name: annual_top_songs annual_top_songs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annual_top_songs ALTER COLUMN annual_top_songs_id SET DEFAULT nextval('public.annual_top_songs_id_seq'::regclass);


--
-- Name: annual_top_songs annual_top_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annual_top_songs
    ADD CONSTRAINT annual_top_songs_pkey PRIMARY KEY (annual_top_songs_id);


--
-- Name: annual_top_songs annual_top_songs_unique_row; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.annual_top_songs
    ADD CONSTRAINT annual_top_songs_unique_row UNIQUE (chart_id, year, year_rank);


--
-- Name: idx_annual_top_songs_artist_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_annual_top_songs_artist_name ON public.annual_top_songs USING btree (artist_name);


--
-- Name: idx_annual_top_songs_song_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_annual_top_songs_song_title ON public.annual_top_songs USING btree (song_title);


--
-- PostgreSQL database dump complete
--

