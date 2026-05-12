-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 12, 2026 at 04:45 PM
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
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `idx_admins_email_unique` (`email`)
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
  `cover_url` varchar(255) DEFAULT NULL,
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
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `artists`
--

INSERT INTO `artists` (`id`, `name`, `profile_image`, `bio`, `created_at`) VALUES
(1, 'Beenie Gunter', '/uploads/general/1778475274991_Beenie.jpg', 'Ugandan Reggae Dancehall Artist', '2026-04-30 20:25:38'),
(2, 'Bayanni', '/uploads/general/1778469917771_Bayanni.webp', 'Nigerian singer-songwriter', '2026-05-01 16:56:47'),
(3, 'Joshua Baraka', '/uploads/general/1778020973267_images.jfif', 'Ugandan musician and music producer', '2026-05-05 22:43:01'),
(4, 'Sheebah Karungi', '/uploads/general/1778357116012_Sheebah.webp', 'Ugandan musician and dancer', '2026-05-09 20:05:16'),
(5, 'Jason Derulo', '/uploads/general/1778469946936_JD.webp', 'American singer-songwriter and dancer', '2026-05-09 20:56:18'),
(6, 'Jidenna', '/uploads/general/1778469891509_jidenna_landscape_2.jpg', 'American rapper and singer', '2026-05-09 20:57:07'),
(7, 'Eddy Kenzo', '/uploads/general/1778469798217_Kenzo.jpeg', 'Ugandan singer and music executive', '2026-05-09 20:57:57'),
(8, 'Wizkid', '/uploads/general/1778469976860_WizKid.jpeg', 'Nigerian singer and songwriter', '2026-05-09 20:58:43'),
(9, 'Diamond Platnumz', '/uploads/general/1778469864217_Diamond.jpeg', 'Tanzanian musician and dance', '2026-05-09 21:10:17'),
(10, 'Wilson Bugembe', '/uploads/general/1778469826522_Bugembe.jpeg', 'Ugandan gospel singer', '2026-05-09 21:10:54'),
(11, 'Davido', '/uploads/general/1778470001051_Davido.webp', 'Nigerian-American singer-songwriter and record producer', '2026-05-09 21:11:34'),
(12, 'Kapeke', '/uploads/general/1778475142666_kapeke.jpg', 'Ugandan Musical artist', '2026-05-11 04:37:52'),
(13, 'Costa Titch', '/uploads/general/1778503544279_costa.webp', 'South African rapper and singer-songwriter', '2026-05-11 12:45:44');

-- --------------------------------------------------------

--
-- Table structure for table `banned_users`
--

DROP TABLE IF EXISTS `banned_users`;
CREATE TABLE IF NOT EXISTS `banned_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `banned_by` int DEFAULT NULL,
  `banned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_active_user_ban` (`user_id`,`is_active`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `plan` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'UGX',
  `transaction_id` varchar(100) DEFAULT NULL,
  `tx_ref` varchar(150) NOT NULL,
  `status` enum('pending','successful','failed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tx_ref` (`tx_ref`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `plan`, `amount`, `currency`, `transaction_id`, `tx_ref`, `status`, `created_at`) VALUES
(1, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778152670147', 'SK_TEST_lite_5_1778152670147_28c695b0', 'successful', '2026-05-07 11:17:50'),
(2, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778153398096', 'SK_TEST_lite_5_1778153398096_07a98df1', 'successful', '2026-05-07 11:29:58'),
(3, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778153421799', 'SK_TEST_lite_5_1778153421799_49b68269', 'successful', '2026-05-07 11:30:21'),
(4, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778153430309', 'SK_TEST_lite_5_1778153430309_fb706f1e', 'successful', '2026-05-07 11:30:30'),
(5, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778153435728', 'SK_TEST_lite_5_1778153435728_809b7ef3', 'successful', '2026-05-07 11:30:35'),
(6, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778153570340', 'SK_TEST_lite_5_1778153570340_7aa53a81', 'successful', '2026-05-07 11:32:50'),
(7, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778154114911', 'SK_TEST_lite_5_1778154114911_48825b64', 'successful', '2026-05-07 11:41:54'),
(8, 5, 'lite', 1000.00, 'UGX', 'TEST_TX_1778154146181', 'SK_TEST_lite_5_1778154146181_d3ff072e', 'successful', '2026-05-07 11:42:26'),
(9, 5, 'standard', 4000.00, 'UGX', 'TEST_TX_1778154182204', 'SK_TEST_standard_5_1778154182204_964e75c8', 'successful', '2026-05-07 11:43:02'),
(10, 5, 'annual', 105000.00, 'UGX', 'TEST_TX_1778154187871', 'SK_TEST_annual_5_1778154187871_5e732567', 'successful', '2026-05-07 11:43:07'),
(11, 5, 'quarterly', 52000.00, 'UGX', 'TEST_TX_1778154195486', 'SK_TEST_quarterly_5_1778154195486_c082efc9', 'successful', '2026-05-07 11:43:15'),
(12, 5, 'family', 10000.00, 'UGX', 'TEST_TX_1778154199059', 'SK_TEST_family_5_1778154199058_0d786edf', 'successful', '2026-05-07 11:43:19'),
(13, 8, 'lite', 1000.00, 'UGX', 'TEST_TX_1778158641228', 'SK_TEST_lite_8_1778158641228_eb8130a5', 'successful', '2026-05-07 12:57:21');

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
  `cover_url` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `year_of_release` year DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `hls_path` varchar(255) DEFAULT NULL,
  `encryption_key` varbinary(32) DEFAULT NULL,
  `key_iv` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `album_id` (`album_id`),
  KEY `idx_songs_artist` (`artist_id`),
  KEY `idx_songs_title` (`title`),
  KEY `idx_songs_genre` (`genre`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `songs`
--

INSERT INTO `songs` (`id`, `title`, `artist_id`, `album_id`, `genre`, `file_url`, `cover_url`, `duration`, `year_of_release`, `created_at`, `hls_path`, `encryption_key`, `key_iv`) VALUES
(5, 'Gundi', 12, NULL, 'Dancehall', '/api/songs/stream/5/master.m3u8', '/uploads/covers/song_covers/1778589346644_gundi.jfif', 179, NULL, '2026-05-11 11:37:40', 'protected_streams/87f32e8f-5b2c-48a9-9688-6f28890e4edb', 0x78cc29c1be3a567c74f89a48a81b0a9a, '6ce39b0626e2c5dd7d3ab4048616f2d1'),
(2, 'Princess Treatment', 2, NULL, 'RnB', '/uploads/songs/1777654607404_Bayanni_-_Princess_Treatment_Lyric_videoMP3_128K.mp3', '/uploads/covers/song_covers/1778589373604_princess-treatment.jfif', 181, NULL, '2026-05-01 16:56:47', NULL, NULL, NULL),
(3, 'Magnetic', 3, NULL, 'RnB', '/api/songs/stream/3/master.m3u8', '/uploads/covers/song_covers/1778588232453_magnetic.jfif', 180, NULL, '2026-05-05 22:43:01', 'protected_streams/cd6961f0-cf5d-422a-b670-7621333dfc92', 0xb0aaac9ec07189f33edb4775aefab3d0, 'b606c7f43b6f91c6751e45745047260c'),
(4, 'Wendi', 1, NULL, 'Afro-dancehall', '/api/songs/stream/4/master.m3u8', '/uploads/covers/song_covers/1778588755492_wendi.jfif', 162, NULL, '2026-05-11 04:35:03', 'protected_streams/3ab64d97-e4ae-4c19-813e-51e11f3d61a1', 0xd413bdb4ba9d4d00315f1eae4783d946, '4761b7ee83f88e7406ded7bb82b5273f'),
(6, 'Ghetto love', 8, NULL, 'Afrobeats', '/api/songs/stream/6/master.m3u8', '/uploads/covers/song_covers/1778589401542_ghetto_love.jfif', 187, NULL, '2026-05-11 12:32:22', 'protected_streams/9ed54b6e-ba74-4ed2-86d7-1bf96b792756', 0x2847da5ce5564818f3dd3ea0069d09b5, '7fbd200b3f9ed30918803986e394c00d'),
(7, 'Feel', 11, NULL, 'Afrobeats', '/api/songs/stream/7/master.m3u8', '/uploads/covers/song_covers/1778588117709_feeel.jfif', 156, NULL, '2026-05-11 12:35:18', 'protected_streams/fd02a3ff-1c73-4ed5-a8e1-063706a53bcf', 0x04c2dda39857003f927eb8e3fff90da7, 'b2d815e78221b2c130f88472a62d7300'),
(8, 'Big Flexa', 13, NULL, 'Amapiano', '/api/songs/stream/8/master.m3u8', '/uploads/covers/song_covers/1778588030939_bigflexa.jfif', 327, NULL, '2026-05-11 12:57:35', 'protected_streams/74a56705-e29e-457d-9312-eb58dd2cf4e6', 0x4c7902f997af2e267df6796677bcab63, 'd2291cb49926a3439bf58fc0c26993e5');

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
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `price`, `duration_days`, `billing_cycle`, `is_family`, `max_users`, `description`, `created_at`) VALUES
(1, 'lite', 1000.00, 1, 'daily', 0, 1, NULL, '2026-05-07 11:29:40'),
(2, 'standard', 4000.00, 30, 'daily', 0, 1, NULL, '2026-05-07 11:29:40'),
(3, 'family', 10000.00, 30, 'daily', 0, 1, NULL, '2026-05-07 11:29:40'),
(4, 'quarterly', 52000.00, 90, 'daily', 0, 1, NULL, '2026-05-07 11:29:40'),
(5, 'annual', 105000.00, 365, 'daily', 0, 1, NULL, '2026-05-07 11:29:40');

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
  `auth_provider` varchar(50) NOT NULL DEFAULT 'local',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `is_verified`, `verification_code`, `verification_code_expires`, `reset_code`, `reset_code_expires`, `verification_code_requests`, `verification_code_window_start`, `reset_code_requests`, `reset_code_window_start`, `google_id`, `auth_provider`) VALUES
(3, 'mujuni emanuel', 'mujuniaubrey4@gmail.com', '$2b$10$jiNHMiv3ha5BIHjBD7vMmeFRfRVk0UmIQNXJleTD420w5ngJI6SBG', '2026-05-04 14:52:04', 1, '407272', '2026-05-04 18:02:22', NULL, NULL, 2, '2026-05-04 17:52:04', 0, NULL, NULL, 'local'),
(9, 'Baraka', 'banksricky48@gmail.com', '$2b$10$h4nwbYpDP45p2HDJideVe.uQ4zIff85BC6UlXfB1.uytmW83/3zmW', '2026-05-11 05:30:54', 1, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 'local'),
(10, 'Alfrie', 'alfredojokgwasujja@gmail.com', '$2b$10$uqUFLXZvmntEdGX3pqQPseoicFX/k0WvKVEZRWbtWMMLfNMVaQqPm', '2026-05-11 13:00:24', 1, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 'local'),
(7, 'kelly', 'twesigyekelly90@gmail.com', '$2b$10$.sFQzxE7TMs23Ve4ths28.6oz3edIPYLcU/59sy0CIUu69CIrddmW', '2026-05-05 13:41:20', 1, '902725', '2026-05-05 16:51:19', NULL, NULL, 1, '2026-05-05 16:41:20', 0, NULL, NULL, 'local'),
(8, 'dorah', 'namuddudorah328@gmail.com', '$2b$10$KMMmaPAE0LNfSK.t9JvxJ.uKrvsmnjTVb39pBjpkifERPq/dA/ODK', '2026-05-07 12:56:06', 1, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 'local');

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
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_subscriptions`
--

INSERT INTO `user_subscriptions` (`id`, `user_id`, `plan_id`, `start_date`, `end_date`, `status`) VALUES
(1, 1, 1, '2026-05-05 23:50:34', '2026-06-04 23:50:34', 'active'),
(2, 5, 3, '2026-05-07 14:43:19', '2026-06-06 14:43:19', 'active'),
(3, 8, 1, '2026-05-07 15:57:21', '2026-05-08 15:57:21', 'active');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
