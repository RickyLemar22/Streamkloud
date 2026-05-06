-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 06, 2026 at 08:59 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `streamkloud`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','content_manager') DEFAULT 'content_manager',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'Ricky Lemar', 'rickylemar0@gmail.com', '$2b$10$HDf95Oy0tQt7AEsBo4HNg./ML0HBxJcFH.jKo0Z8baoF.whCWCH.q', 'super_admin', '2026-05-01 04:14:19');

-- --------------------------------------------------------

--
-- Table structure for table `albums`
--

DROP TABLE IF EXISTS `albums`;
CREATE TABLE IF NOT EXISTS `albums` (
  `id` int NOT NULL AUTO_INCREMENT,
  `artist_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `release_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `artist_id` (`artist_id`),
  KEY `idx_albums_title` (`title`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `artists`
--

DROP TABLE IF EXISTS `artists`;
CREATE TABLE IF NOT EXISTS `artists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `bio` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_artists_name` (`name`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `artists`
--

INSERT INTO `artists` (`id`, `name`, `profile_image`, `bio`, `created_at`) VALUES
(1, 'Beenie Gunter', '/uploads/covers/1777580737737_beenie2.jfif', NULL, '2026-04-30 20:25:38'),
(2, 'Bayanni', '/uploads/covers/1777654607716_beenie.jfif', NULL, '2026-05-01 16:56:47'),
(3, 'Joshua Baraka', '/uploads/covers/1778020973267_images.jfif', NULL, '2026-05-05 22:43:01');

-- --------------------------------------------------------

--
-- Table structure for table `family_members`
--

DROP TABLE IF EXISTS `family_members`;
CREATE TABLE IF NOT EXISTS `family_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscription_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('owner','member') DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subscription_id` (`subscription_id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
CREATE TABLE IF NOT EXISTS `likes` (
  `user_id` int NOT NULL,
  `song_id` int NOT NULL,
  `liked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`song_id`),
  KEY `song_id` (`song_id`),
  KEY `idx_likes_user` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `playlists`
--

DROP TABLE IF EXISTS `playlists`;
CREATE TABLE IF NOT EXISTS `playlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_playlists_user` (`user_id`),
  KEY `idx_playlists_user_id` (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `playlist_songs`
--

DROP TABLE IF EXISTS `playlist_songs`;
CREATE TABLE IF NOT EXISTS `playlist_songs` (
  `playlist_id` int NOT NULL,
  `song_id` int NOT NULL,
  `added_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`playlist_id`,`song_id`),
  KEY `song_id` (`song_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `songs`
--

DROP TABLE IF EXISTS `songs`;
CREATE TABLE IF NOT EXISTS `songs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `artist_id` int NOT NULL,
  `album_id` int DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `file_url` varchar(255) NOT NULL,
  `duration` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `hls_path` varchar(255) DEFAULT NULL,
  `encryption_key` varbinary(32) DEFAULT NULL,
  `key_iv` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `album_id` (`album_id`),
  KEY `idx_songs_artist` (`artist_id`),
  KEY `idx_songs_title` (`title`),
  KEY `idx_songs_genre` (`genre`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `songs`
--

INSERT INTO `songs` (`id`, `title`, `artist_id`, `album_id`, `genre`, `file_url`, `duration`, `created_at`, `hls_path`, `encryption_key`, `key_iv`) VALUES
(1, 'Gundi', 1, NULL, 'R&B', '/uploads/songs/1777580735216_GundiRemix_Kapeke_ft_Mimi_Kampala_Official_Video_MP3_160K.mp3', 179, '2026-04-30 20:25:38', NULL, NULL, NULL),
(2, 'Princess Treatment', 2, NULL, 'RnB', '/uploads/songs/1777654607404_Bayanni_-_Princess_Treatment_Lyric_videoMP3_128K.mp3', 181, '2026-05-01 16:56:47', NULL, NULL, NULL),
(3, 'Magnetoi', 3, NULL, 'RnB', '/api/songs/stream/3/master.m3u8', 180, '2026-05-05 22:43:01', 'protected_streams/cd6961f0-cf5d-422a-b670-7621333dfc92', 0xb0aaac9ec07189f33edb4775aefab3d0, 'b606c7f43b6f91c6751e45745047260c');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int NOT NULL,
  `billing_cycle` enum('daily','monthly','biannual','annual','free') NOT NULL,
  `is_family` tinyint(1) DEFAULT '0',
  `max_users` int DEFAULT '1',
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_code` varchar(10) DEFAULT NULL,
  `verification_code_expires` datetime DEFAULT NULL,
  `reset_code` varchar(10) DEFAULT NULL,
  `reset_code_expires` datetime DEFAULT NULL,
  `verification_code_requests` int DEFAULT '0',
  `verification_code_window_start` datetime DEFAULT NULL,
  `reset_code_requests` int DEFAULT '0',
  `reset_code_window_start` datetime DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `is_verified`, `verification_code`, `verification_code_expires`, `reset_code`, `reset_code_expires`, `verification_code_requests`, `verification_code_window_start`, `reset_code_requests`, `reset_code_window_start`, `google_id`) VALUES
(1, 'Daphine', 'daphineainembabazi50@gmail.com', '$2b$10$KGsA0BBwuWjQ4h/T5YGozO6ZxyXxO2KAJtlhI1IsXk/fwedMj0R/K', '2026-05-01 17:05:41', 0, NULL, NULL, '212442', '2026-05-05 00:46:51', 0, NULL, 1, '2026-05-05 00:36:51', NULL),
(3, 'mujuni emanuel', 'mujuniaubrey4@gmail.com', '$2b$10$jiNHMiv3ha5BIHjBD7vMmeFRfRVk0UmIQNXJleTD420w5ngJI6SBG', '2026-05-04 14:52:04', 0, '407272', '2026-05-04 18:02:22', NULL, NULL, 2, '2026-05-04 17:52:04', 0, NULL, NULL),
(5, 'gabz', 'banksricky48@gmail.com', '$2b$10$iYNmBBz4rSVxESyPkMyW7.LaP7J55R9FcyjWESw14.lyeX/19.ZW6', '2026-05-04 21:43:35', 0, '879336', '2026-05-05 00:53:35', NULL, NULL, 1, '2026-05-05 00:43:35', 0, NULL, NULL),
(6, 'lemar', 'liliannalumansi25@gmail.com', '$2b$10$HKzpsHlZep1GBIGwS9ATtuN3UpAQoHzquVGW2IhRZ86kaHN0lrFR.', '2026-05-05 04:27:51', 1, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL),
(7, 'kelly', 'twesigyekelly90@gmail.com', '$2b$10$.sFQzxE7TMs23Ve4ths28.6oz3edIPYLcU/59sy0CIUu69CIrddmW', '2026-05-05 13:41:20', 0, '902725', '2026-05-05 16:51:19', NULL, NULL, 1, '2026-05-05 16:41:20', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_subscriptions`
--

DROP TABLE IF EXISTS `user_subscriptions`;
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `plan_id` int NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `plan_id` (`plan_id`),
  KEY `idx_user_subscriptions_user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_subscriptions`
--

INSERT INTO `user_subscriptions` (`id`, `user_id`, `plan_id`, `start_date`, `end_date`, `status`) VALUES
(1, 1, 1, '2026-05-05 23:50:34', '2026-06-04 23:50:34', 'active');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
