-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql.railway.internal:3306
-- Generation Time: May 26, 2026 at 03:37 AM
-- Server version: 9.4.0
-- PHP Version: 8.5.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `railway`
--

-- --------------------------------------------------------

--
-- Table structure for table `custom_quilt_requests`
--

CREATE TABLE `custom_quilt_requests` (
  `id` int UNSIGNED NOT NULL,
  `request_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `design_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `design_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_size` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_palette` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batting` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quilt_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `custom_quilt_requests`
--

INSERT INTO `custom_quilt_requests` (`id`, `request_number`, `status`, `design_id`, `design_name`, `product_size`, `color_palette`, `batting`, `quilt_title`, `notes`, `customer_name`, `customer_email`, `customer_phone`, `estimated_price`, `created_at`, `updated_at`) VALUES
(1, 'CQMPIJBR39366', 'submitted', 'patchwork-heritage', 'Patchwork Heritage', 'large', 'warm-neutrals', 'cotton', 'test', 'test', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', 289.00, '2026-05-23 16:00:20', '2026-05-23 16:00:20'),
(2, 'CQMPJL5SLN915', 'submitted', 'sunset-flying-geese', 'Sunset Flying Geese', 'x-large', 'sage-greens', 'wool', 'test', 'test', 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', 334.88, '2026-05-24 09:39:28', '2026-05-24 09:39:28');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int UNSIGNED NOT NULL,
  `order_number` varchar(32) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(64) DEFAULT NULL,
  `shipping_address1` varchar(255) NOT NULL,
  `shipping_address2` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(120) NOT NULL,
  `shipping_state` varchar(120) NOT NULL,
  `shipping_postal_code` varchar(40) NOT NULL,
  `shipping_country` varchar(120) NOT NULL,
  `shipping_method` varchar(32) NOT NULL DEFAULT 'standard',
  `shipping_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `billing_name` varchar(255) NOT NULL,
  `billing_address1` varchar(255) NOT NULL,
  `billing_address2` varchar(255) DEFAULT NULL,
  `billing_city` varchar(120) NOT NULL,
  `billing_state` varchar(120) NOT NULL,
  `billing_postal_code` varchar(40) NOT NULL,
  `billing_country` varchar(120) NOT NULL,
  `card_last4` varchar(4) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payment_method` varchar(32) NOT NULL DEFAULT 'manual',
  `stripe_checkout_session_id` varchar(255) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `tracking_carrier` varchar(32) DEFAULT NULL,
  `tracking_number` varchar(64) DEFAULT NULL,
  `tracking_notified_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `status`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address1`, `shipping_address2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `shipping_method`, `shipping_cost`, `billing_name`, `billing_address1`, `billing_address2`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `card_last4`, `subtotal`, `tax_amount`, `total`, `created_at`, `updated_at`, `payment_method`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `tracking_carrier`, `tracking_number`, `tracking_notified_at`) VALUES
(1, 'QMOZSNTVC263', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4999', 91.01, 7.51, 108.51, '2026-05-10 13:14:03', '2026-05-10 13:14:03', 'manual', NULL, NULL, NULL, NULL, NULL),
(2, 'QMOZSRN13707', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4888', 418.75, 34.55, 463.29, '2026-05-10 13:17:01', '2026-05-10 13:17:01', 'manual', NULL, NULL, NULL, NULL, NULL),
(3, 'QMOZSZH4Y339', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4888', 228.83, 18.88, 257.70, '2026-05-10 13:23:06', '2026-05-10 13:23:06', 'manual', NULL, NULL, NULL, NULL, NULL),
(4, 'QMOZT3AW9715', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4999', 228.83, 18.88, 257.70, '2026-05-10 13:26:05', '2026-05-10 13:26:05', 'manual', NULL, NULL, NULL, NULL, NULL),
(5, 'QMP0BT3JZ257', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '2000', 427.15, 35.24, 482.38, '2026-05-10 22:10:01', '2026-05-10 22:10:01', 'manual', NULL, NULL, NULL, NULL, NULL),
(6, 'QMP0C1YVY994', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4442', 418.75, 34.55, 473.29, '2026-05-10 22:16:55', '2026-05-10 22:16:55', 'manual', NULL, NULL, NULL, NULL, NULL),
(7, 'QMP0C8L00763', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4000', 228.83, 18.88, 257.70, '2026-05-10 22:22:04', '2026-05-23 16:13:10', 'manual', NULL, NULL, 'dhl', '32452353245', '2026-05-23 16:13:10'),
(8, 'QMP0CDIKW720', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '2000', 213.79, 17.64, 241.42, '2026-05-10 22:25:54', '2026-05-10 22:25:54', 'manual', NULL, NULL, NULL, NULL, NULL),
(9, 'QMP0CIBFP724', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '3000', 254.92, 21.03, 295.94, '2026-05-10 22:29:38', '2026-05-10 22:29:38', 'manual', NULL, NULL, NULL, NULL, NULL),
(10, 'QMP0LFZG4107', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4000', 254.92, 21.03, 295.94, '2026-05-11 02:39:46', '2026-05-11 02:39:46', 'manual', NULL, NULL, NULL, NULL, NULL),
(11, 'QMP1F3L6E383', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4000', 228.83, 18.88, 257.70, '2026-05-11 16:29:56', '2026-05-11 16:29:56', 'manual', NULL, NULL, NULL, NULL, NULL),
(12, 'QMP1F8ABM346', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '5000', 228.83, 18.88, 257.70, '2026-05-11 16:33:35', '2026-05-11 16:33:35', 'manual', NULL, NULL, NULL, NULL, NULL),
(13, 'QMP1FB4UP627', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '7000', 254.92, 21.03, 285.94, '2026-05-11 16:35:48', '2026-05-11 16:35:48', 'manual', NULL, NULL, NULL, NULL, NULL),
(14, 'QMP1IM543161', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 Holly Springs Drive', '', 'CHARLES TOWN', 'WV', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 Holly Springs Drive', '', 'CHARLES TOWN', 'WV', '25414', 'USA', '4888', 91.01, 7.51, 108.51, '2026-05-11 18:08:20', '2026-05-11 18:08:20', 'manual', NULL, NULL, NULL, NULL, NULL),
(15, 'QMP2SIPSQ920', 'paid', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '3999', 228.83, 18.88, 267.70, '2026-05-12 15:33:23', '2026-05-20 04:42:43', 'manual', NULL, NULL, NULL, NULL, NULL),
(16, 'QMP2SN3CS266', 'fulfilled', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '2999', 91.01, 7.51, 108.51, '2026-05-12 15:36:47', '2026-05-15 02:58:52', 'manual', NULL, NULL, NULL, NULL, NULL),
(17, 'QMPG1NLE3454', 'fulfilled', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 528.32, 43.59, 581.90, '2026-05-21 22:10:07', '2026-05-26 03:29:03', 'stripe', 'cs_test_b1enVixGwpbAKtKkUORji6dwwuWDdfQKlmpg9gWwsNMRlB99LjmCklsOyB', 'pi_3TZenZBQe8WfAxpb29mgWmJi', 'ups', '1Z213423423434234', '2026-05-26 03:29:03'),
(18, 'QMPG24DBX966', 'paid', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 418.75, 34.55, 463.29, '2026-05-21 22:23:10', '2026-05-21 22:23:38', 'stripe', 'cs_test_b16wQT4gV1uPXwaO7S8MtJLMQqZfZg14tkezcOICkO1oM4olxL4ZM1yYlR', 'pi_3TZf07BQe8WfAxpb0fOdMpRP', NULL, NULL, NULL),
(19, 'QMPGK4BW0491', 'fulfilled', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 91.01, 7.51, 118.51, '2026-05-22 06:47:01', '2026-05-23 16:07:43', 'stripe', 'cs_test_b1SFDSM3BHZogFozMB61KVTN2fEOQNrHGSh1ZgdFM7ZlPocZMQvHH1gGO4', 'pi_3TZmrmBQe8WfAxpb2m7mJ9wD', 'usps', '82934234234234234', '2026-05-23 16:07:43'),
(20, 'QMPGUWOAP738', 'fulfilled', 'Badrul Nadim ', 'aminbadrul101@gmail.com', '5716996447', '1204 w clay st ', '', 'Richmond ', 'VA', '23220', 'USA', 'standard', 9.99, 'Badrul Nadim ', '1204 w clay st ', '', 'Richmond ', 'VA', '23220', 'USA', 'STRP', 254.92, 21.03, 285.94, '2026-05-22 11:49:00', '2026-05-26 03:28:23', 'stripe', 'cs_test_b1nacPAO033RjXWEs1OQm8tVsJC7wJh67dbLQzdpTbaAZZuUHJZFslvURC', 'pi_3TZraYBQe8WfAxpb0aw794OS', 'ups', '1Z239048203942342', '2026-05-26 03:28:23'),
(21, 'QMPJVNXPZ866', 'paid', 'Susan Kelly', 'susa.k@gmail.com', '7187873777', '192 hople gallye road', '', 'Queens', 'NY', '10003', 'USA', 'standard', 9.99, 'Susan Kelly', '192 hople gallye road', '', 'Queens', 'NY', '10003', 'USA', 'STRP', 327.34, 27.01, 364.34, '2026-05-24 14:33:30', '2026-05-24 14:34:31', 'stripe', 'cs_test_b1H7jUUzXRAG7lTbVxGz272OCbdac7viuVIe7FVCGOGjEzrDnAhkm3mCF1', 'pi_3Tad6kBQe8WfAxpb0YN9bgFo', NULL, NULL, NULL),
(22, 'QMPKF918R588', 'fulfilled', 'test a1', 'asbg@gmail.com', '4565431234', 'twst1', '', 'sterling', 'va', '20166', 'USA', 'express', 19.99, 'test a1', 'twst1', '', 'sterling', 'va', '20166', 'USA', 'STRP', 418.75, 34.55, 473.29, '2026-05-24 23:41:47', '2026-05-24 23:44:41', 'stripe', 'cs_test_b1SYY9Yy9A33DAmmzvQljgjPLGvoFyTkWjTTp330HL2IwYRtYboRsj1POZ', 'pi_3TalfYBQe8WfAxpb1QBM33me', 'usps', '7776777677766', '2026-05-24 23:44:41'),
(23, 'QMPM2WJYW140', 'fulfilled', 'Tracy A.', 'tracyalto@brqllc.com', '800-472-7849', '88 Loudoun Country Blvd', '', 'Ashburn', 'VA', '20175', 'USA', 'express', 19.99, 'Tracy A.', '88 Loudoun Country Blvd', '', 'Ashburn', 'VA', '20175', 'USA', 'STRP', 377.27, 31.12, 428.38, '2026-05-26 03:31:42', '2026-05-26 03:32:59', 'stripe', 'cs_test_b1a4VE9hOURZdVHjq3I5y0OJUkmRe7iE3jOrph0uRH2RHuHxbKgVLN0tRN', 'pi_3TbBj9BQe8WfAxpb0vzH424L', 'usps', '123128332423', '2026-05-26 03:32:59');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int UNSIGNED NOT NULL,
  `line_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`) VALUES
(1, 1, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01),
(2, 2, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75),
(3, 3, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83),
(4, 4, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83),
(5, 5, 3043, 'Ivory Autumn Leaf Handmade Quilt', 427.15, 1, 427.15),
(6, 6, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75),
(7, 7, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83),
(8, 8, 3034, 'Sage Autumn Leaf Handmade Quilt', 213.79, 1, 213.79),
(9, 9, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92),
(10, 10, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92),
(11, 11, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83),
(12, 12, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83),
(13, 13, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92),
(14, 14, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01),
(15, 15, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83),
(16, 16, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01),
(17, 17, 3007, 'Amber Artisan Diamond Handmade Quilt', 118.46, 1, 118.46),
(18, 17, 3016, 'Spruce Rail Fence Handmade Quilt', 409.86, 1, 409.86),
(19, 18, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75),
(20, 19, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01),
(21, 20, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92),
(22, 21, 3042, 'Rosewood Velvet Horizon Handmade Quilt', 327.34, 1, 327.34),
(23, 22, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75),
(24, 23, 3037, 'Indigo Rail Fence Handmade Quilt (XX-Large)', 377.27, 1, 377.27);

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `id` int UNSIGNED NOT NULL,
  `slug` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` mediumtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `page_products`
--

CREATE TABLE `page_products` (
  `page_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int UNSIGNED NOT NULL,
  `sku` varchar(64) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock_quantity` int UNSIGNED NOT NULL DEFAULT '0',
  `product_size` varchar(32) DEFAULT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `sku`, `name`, `description`, `price`, `stock_quantity`, `product_size`, `image_url`, `is_published`, `created_at`, `updated_at`) VALUES
(3001, 'BRQ-3001', 'Oatmeal Modern Heirloom Handmade Quilt', 'Full/Queen medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 180.98, 70, NULL, '/uploads/products/3001/1779626968531-i6bqdx7l.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:49:30'),
(3002, 'BRQ-3002', 'Spruce Bargello Waves Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 184.11, 49, NULL, '/uploads/products/3002/1779626576226-zqdsy5do.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:42:58'),
(3003, 'BRQ-3003', 'Rosewood Willow Stitch Handmade Quilt', 'Full/Queen plush handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 291.02, 29, NULL, '/uploads/products/3003/1779627034129-sxo89984.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:50:36'),
(3004, 'BRQ-3004', 'Amber Patchwork Star Handmade Quilt', 'Full/Queen medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 348.30, 78, NULL, '/uploads/products/3004/1779625651431-58eouaw8.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:27:38'),
(3005, 'BRQ-3005', 'Fig Soft Loom Handmade Quilt', 'King medium loft handmade quilt with bamboo fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 237.68, 73, NULL, '/uploads/products/3005/1779626139618-bbd4sf8w.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:35:41'),
(3006, 'BRQ-3006', 'Pearl Linen Field Handmade Quilt', 'Throw lightweight handmade quilt with wool blend fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 221.38, 46, NULL, '/uploads/products/3006/1779627260441-w8krqrcj.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:54:22'),
(3007, 'BRQ-3007', 'Amber Artisan Diamond Handmade Quilt', 'Full/Queen plush handmade quilt with wool blend fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 118.46, 31, 'large', '/uploads/products/3007/1779625509893-8g74ai1z.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:25:13'),
(3008, 'BRQ-3008', 'Stone Cotton Cloud Handmade Quilt', 'Full/Queen all-season handmade quilt with bamboo fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 265.16, 81, NULL, '/uploads/products/3008/1779626197262-qkn8rs9o.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:36:40'),
(3009, 'BRQ-3009', 'Slate Winterberry Handmade Quilt', 'Full/Queen lightweight handmade quilt with wool blend fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 227.14, 85, NULL, '/uploads/products/3009/1779626618810-mau056ju.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:43:40'),
(3010, 'BRQ-3010', 'Terracotta Artisan Diamond Handmade Quilt', 'Twin plush handmade quilt with cotton fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 142.04, 31, NULL, '/uploads/products/3010/1779626345665-y72uv4nd.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:39:08'),
(3011, 'BRQ-3011', 'Cream Sunrise Patch Handmade Quilt', 'Twin lightweight handmade quilt with bamboo fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 432.73, 72, NULL, '/uploads/products/3011/1779625896227-4rhye8jm.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:31:44'),
(3012, 'BRQ-3012', 'Rosewood Heritage Patchwork Handmade Quilt', 'King plush handmade quilt with microfiber fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 338.04, 87, NULL, '/uploads/products/3012/1779627207136-p3ma0qmm.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:53:29'),
(3013, 'BRQ-3013', 'Mist Cottage Stripe Handmade Quilt', 'King medium loft handmade quilt with wool blend fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 291.65, 76, NULL, '/uploads/products/3013/1779626798800-b3xps8qw.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:46:40'),
(3014, 'BRQ-3014', 'Cream Dresden Plate Handmade Quilt', 'Twin lightweight handmade quilt with wool blend fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 105.73, 98, NULL, '/uploads/products/3014/1779625765250-0pcqoohu.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:29:27'),
(3015, 'BRQ-3015', 'Stone Soft Loom Handmade Quilt', 'Full/Queen medium loft handmade quilt with microfiber fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 195.57, 72, NULL, '/uploads/products/3015/1779626176812-hauznb9k.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:36:18'),
(3016, 'BRQ-3016', 'Spruce Rail Fence Handmade Quilt', 'King lightweight handmade quilt with microfiber fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 409.86, 51, 'xx-large', '/uploads/products/3016/1779626370476-dsukve74.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:39:33'),
(3017, 'BRQ-3017', 'Cream Willow Stitch Handmade Quilt', 'Full/Queen all-season handmade quilt with wool blend fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 107.54, 86, NULL, '/uploads/products/3017/1779625989623-2uorm2nk.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:33:12'),
(3018, 'BRQ-3018', 'Amber Velvet Horizon Handmade Quilt', 'Throw all-season handmade quilt with bamboo fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 329.02, 91, NULL, '/uploads/products/3018/1779625701101-ovzhcg42.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:28:22'),
(3019, 'BRQ-3019', 'Blush Cathedral Window Handmade Quilt', 'King lightweight handmade quilt with bamboo fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 199.22, 99, NULL, '/uploads/products/3019/1779625725031-9ulratrt.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:28:47'),
(3020, 'BRQ-3020', 'Dusk Riverstone Handmade Quilt', 'King plush handmade quilt with bamboo fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 163.60, 48, 'xxx-large', '/uploads/products/3020/1779626060135-zh3i9nl2.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:34:23'),
(3021, 'BRQ-3021', 'Amber Garden Path Handmade Quilt', 'King all-season handmade quilt with wool blend fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 301.37, 39, NULL, '/uploads/products/3021/1779625563611-0y13x4fk.jpg', 1, '2026-05-10 13:09:22', '2026-05-24 12:26:07'),
(3022, 'BRQ-3022', 'Amber Honeycomb Hex Handmade Quilt', 'Full/Queen plush handmade quilt with organic cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 298.06, 37, NULL, '/uploads/products/3022/1779625630840-vgkwxs6f.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:27:13'),
(3023, 'BRQ-3023', 'Pearl Rail Fence Handmade Quilt', 'King all-season handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 162.01, 71, NULL, '/uploads/products/3023/1779627238529-6lbnphg6.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:54:01'),
(3024, 'BRQ-3024', 'Spruce Prairie Weave Handmade Quilt', 'King all-season handmade quilt with bamboo fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 175.50, 62, NULL, '/uploads/products/3024/1779626495426-61n67sif.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:41:37'),
(3025, 'BRQ-3025', 'Honey Dresden Plate Handmade Quilt', 'Twin plush handmade quilt with bamboo fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 240.30, 96, NULL, '/uploads/products/3025/1779626391136-w7fbutrg.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:39:53'),
(3026, 'BRQ-3026', 'Amber Dresden Plate Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 400.37, 71, NULL, '/uploads/products/3026/1779625536546-ustig3y0.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:25:40'),
(3027, 'BRQ-3027', 'Cream Sunrise Patch Handmade Quilt', 'Twin medium loft handmade quilt with organic cotton fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 334.90, 37, NULL, '/uploads/products/3027/1779625954317-qencguip.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:32:37'),
(3028, 'BRQ-3028', 'Cream Garden Path Handmade Quilt', 'Twin plush handmade quilt with cotton fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 427.55, 48, NULL, '/uploads/products/3028/1779625813721-8trh8n9c.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:30:15'),
(3029, 'BRQ-3029', 'Stone Artisan Diamond Handmade Quilt', 'Full/Queen medium loft handmade quilt with organic cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 105.60, 78, NULL, '/uploads/products/3029/1779626318266-i8zfl59i.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:38:40'),
(3030, 'BRQ-3030', 'Copper Prairie Weave Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 392.87, 83, NULL, '/uploads/products/3030/1779625746970-dxfbny8s.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:29:09'),
(3031, 'BRQ-3031', 'Oatmeal Summit Cross Handmade Quilt', 'King lightweight handmade quilt with cotton fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 365.99, 65, NULL, '/uploads/products/3031/1779627002800-d2vywtus.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:50:05'),
(3032, 'BRQ-3032', 'Rosewood Midnight Star Handmade Quilt', 'Full/Queen plush handmade quilt with organic cotton fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 184.72, 34, NULL, '/uploads/products/3032/1779627119031-ov13e48n.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:52:01'),
(3033, 'BRQ-3033', 'Indigo Hand-Stitched Bloom Handmade Quilt', 'King medium loft handmade quilt with organic cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 258.25, 77, NULL, '/uploads/products/3033/1779626438560-aql5ufn8.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:40:40'),
(3034, 'BRQ-3034', 'Sage Autumn Leaf Handmade Quilt', 'Throw lightweight handmade quilt with wool blend fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 213.79, 42, NULL, '/uploads/products/3034/1779626896327-qb1848d4.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:48:24'),
(3035, 'BRQ-3035', 'Rosewood Linen Field Handmade Quilt', 'Full/Queen lightweight handmade quilt with cotton fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 348.61, 61, NULL, '/uploads/products/3035/1779627177691-lrypipvq.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:53:01'),
(3036, 'BRQ-3036', 'Sand Prairie Weave Handmade Quilt', 'Throw lightweight handmade quilt with microfiber fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 103.26, 31, NULL, '/uploads/products/3036/1779626645500-chmpvrsf.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:44:08'),
(3037, 'BRQ-3037', 'Indigo Rail Fence Handmade Quilt', 'Twin all-season handmade quilt with organic cotton fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 287.27, 74, NULL, '/uploads/products/3037/1779626462506-08dpzdz5.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:41:05'),
(3038, 'BRQ-3038', 'Mist Wholecloth Echo Handmade Quilt', 'Throw plush handmade quilt with cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 208.31, 73, NULL, '/uploads/products/3038/1779626835946-zfl8mlhp.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:47:18'),
(3039, 'BRQ-3039', 'Ivory Midnight Star Handmade Quilt', 'Throw medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 334.28, 67, NULL, '/uploads/products/3039/1779626548166-gxwyp0vp.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:42:30'),
(3040, 'BRQ-3040', 'Oatmeal Cottage Stripe Handmade Quilt', 'King plush handmade quilt with cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 185.52, 67, NULL, '/uploads/products/3040/1779626924028-xpshrqbv.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:48:46'),
(3041, 'BRQ-3041', 'Ivory Riverstone Handmade Quilt', 'Throw medium loft handmade quilt with organic cotton fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 265.60, 85, NULL, '/uploads/products/3041/1779626676091-zf1o7wsl.jpg', 1, '2026-05-10 13:09:22', '2026-05-24 12:44:38'),
(3042, 'BRQ-3042', 'Rosewood Velvet Horizon Handmade Quilt', 'Twin lightweight handmade quilt with organic cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 327.34, 62, NULL, '/uploads/products/3042/1779627093751-zft7rwc0.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:51:35'),
(3043, 'BRQ-3043', 'Ivory Autumn Leaf Handmade Quilt', 'Throw lightweight handmade quilt with bamboo fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 427.15, 62, NULL, '/uploads/products/3043/1779626527126-i2jafvhg.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:42:10'),
(3044, 'BRQ-3044', 'Terracotta Winterberry Handmade Quilt', 'Throw plush handmade quilt with microfiber fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 228.83, 64, NULL, '/uploads/products/3044/1779625793968-y99v88ad.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:29:57'),
(3045, 'BRQ-3045', 'Pearl Flying Geese Handmade Quilt', 'Throw medium loft handmade quilt with cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 364.78, 10, NULL, '/uploads/products/3045/1779627147926-s96gxz3d.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:52:31'),
(3046, 'BRQ-3046', 'Fig Dresden Plate Handmade Quilt', 'King all-season handmade quilt with cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 254.92, 22, NULL, '/uploads/products/3046/1779626111442-afwl9y4f.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:35:14'),
(3047, 'BRQ-3047', 'Dusk Hand-Stitched Bloom Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 220.79, 95, NULL, '/uploads/products/3047/1779626039641-l4btfsab.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:34:02'),
(3048, 'BRQ-3048', 'Terracotta Summit Cross Handmade Quilt', 'Throw plush handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 441.39, 99, NULL, '/uploads/products/3048/1779626158426-tsttjhm4.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:35:59'),
(3049, 'BRQ-3049', 'Cream Rail Fence Handmade Quilt', 'Full/Queen medium loft handmade quilt with bamboo fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 418.75, 28, 'x-large', '/uploads/products/3049/1779625871502-z4i6oeef.webp', 1, '2026-05-10 13:09:22', '2026-05-24 12:31:14'),
(3050, 'BRQ-3050', 'Stone Log Cabin Handmade Quilt', 'Throw medium loft handmade quilt with wool blend fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 91.01, 49, NULL, '/uploads/products/3050/1779619403462-w01qnl0l.webp', 1, '2026-05-10 13:09:22', '2026-05-24 10:43:27');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `path` varchar(512) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `path`, `sort_order`, `created_at`) VALUES
(56, 3050, '/uploads/products/3050/1779619403462-w01qnl0l.webp', 0, '2026-05-24 10:43:24'),
(57, 3007, '/uploads/products/3007/1779625509893-8g74ai1z.webp', 0, '2026-05-24 12:25:10'),
(58, 3026, '/uploads/products/3026/1779625536546-ustig3y0.webp', 0, '2026-05-24 12:25:38'),
(59, 3021, '/uploads/products/3021/1779625563611-0y13x4fk.jpg', 0, '2026-05-24 12:26:04'),
(61, 3022, '/uploads/products/3022/1779625630840-vgkwxs6f.webp', 0, '2026-05-24 12:27:12'),
(62, 3004, '/uploads/products/3004/1779625651431-58eouaw8.webp', 0, '2026-05-24 12:27:32'),
(63, 3018, '/uploads/products/3018/1779625701101-ovzhcg42.webp', 0, '2026-05-24 12:28:21'),
(64, 3019, '/uploads/products/3019/1779625725031-9ulratrt.webp', 0, '2026-05-24 12:28:45'),
(65, 3030, '/uploads/products/3030/1779625746970-dxfbny8s.webp', 0, '2026-05-24 12:29:07'),
(66, 3014, '/uploads/products/3014/1779625765250-0pcqoohu.webp', 0, '2026-05-24 12:29:26'),
(67, 3044, '/uploads/products/3044/1779625793968-y99v88ad.webp', 0, '2026-05-24 12:29:54'),
(68, 3028, '/uploads/products/3028/1779625813721-8trh8n9c.webp', 0, '2026-05-24 12:30:14'),
(70, 3049, '/uploads/products/3049/1779625871502-z4i6oeef.webp', 0, '2026-05-24 12:31:12'),
(71, 3011, '/uploads/products/3011/1779625896227-4rhye8jm.webp', 0, '2026-05-24 12:31:36'),
(72, 3027, '/uploads/products/3027/1779625954317-qencguip.webp', 0, '2026-05-24 12:32:34'),
(73, 3017, '/uploads/products/3017/1779625989623-2uorm2nk.webp', 0, '2026-05-24 12:33:10'),
(74, 3047, '/uploads/products/3047/1779626039641-l4btfsab.webp', 0, '2026-05-24 12:34:00'),
(75, 3020, '/uploads/products/3020/1779626060135-zh3i9nl2.webp', 0, '2026-05-24 12:34:20'),
(77, 3046, '/uploads/products/3046/1779626111442-afwl9y4f.webp', 0, '2026-05-24 12:35:11'),
(78, 3005, '/uploads/products/3005/1779626139618-bbd4sf8w.webp', 0, '2026-05-24 12:35:39'),
(79, 3048, '/uploads/products/3048/1779626158426-tsttjhm4.webp', 0, '2026-05-24 12:35:58'),
(80, 3015, '/uploads/products/3015/1779626176812-hauznb9k.webp', 0, '2026-05-24 12:36:17'),
(81, 3008, '/uploads/products/3008/1779626197262-qkn8rs9o.webp', 0, '2026-05-24 12:36:37'),
(82, 3029, '/uploads/products/3029/1779626318266-i8zfl59i.webp', 0, '2026-05-24 12:38:38'),
(83, 3010, '/uploads/products/3010/1779626345665-y72uv4nd.webp', 0, '2026-05-24 12:39:06'),
(84, 3016, '/uploads/products/3016/1779626370476-dsukve74.webp', 0, '2026-05-24 12:39:30'),
(85, 3025, '/uploads/products/3025/1779626391136-w7fbutrg.webp', 0, '2026-05-24 12:39:51'),
(86, 3033, '/uploads/products/3033/1779626438560-aql5ufn8.webp', 0, '2026-05-24 12:40:39'),
(87, 3037, '/uploads/products/3037/1779626462506-08dpzdz5.webp', 0, '2026-05-24 12:41:03'),
(88, 3024, '/uploads/products/3024/1779626495426-61n67sif.webp', 0, '2026-05-24 12:41:36'),
(89, 3043, '/uploads/products/3043/1779626527126-i2jafvhg.webp', 0, '2026-05-24 12:42:07'),
(90, 3039, '/uploads/products/3039/1779626548166-gxwyp0vp.webp', 0, '2026-05-24 12:42:28'),
(91, 3002, '/uploads/products/3002/1779626576226-zqdsy5do.webp', 0, '2026-05-24 12:42:56'),
(92, 3009, '/uploads/products/3009/1779626618810-mau056ju.webp', 0, '2026-05-24 12:43:39'),
(93, 3036, '/uploads/products/3036/1779626645500-chmpvrsf.webp', 0, '2026-05-24 12:44:06'),
(94, 3041, '/uploads/products/3041/1779626676091-zf1o7wsl.jpg', 0, '2026-05-24 12:44:36'),
(95, 3013, '/uploads/products/3013/1779626798800-b3xps8qw.webp', 0, '2026-05-24 12:46:39'),
(96, 3038, '/uploads/products/3038/1779626835946-zfl8mlhp.webp', 0, '2026-05-24 12:47:16'),
(97, 3034, '/uploads/products/3034/1779626896327-qb1848d4.webp', 0, '2026-05-24 12:48:16'),
(98, 3040, '/uploads/products/3040/1779626924028-xpshrqbv.webp', 0, '2026-05-24 12:48:44'),
(99, 3034, '/uploads/products/3034/1779626948172-v7122jzj.webp', 1, '2026-05-24 12:49:08'),
(100, 3001, '/uploads/products/3001/1779626968531-i6bqdx7l.webp', 0, '2026-05-24 12:49:29'),
(101, 3031, '/uploads/products/3031/1779627002800-d2vywtus.webp', 0, '2026-05-24 12:50:03'),
(102, 3003, '/uploads/products/3003/1779627034129-sxo89984.webp', 0, '2026-05-24 12:50:34'),
(103, 3042, '/uploads/products/3042/1779627093751-zft7rwc0.webp', 0, '2026-05-24 12:51:34'),
(104, 3032, '/uploads/products/3032/1779627119031-ov13e48n.webp', 0, '2026-05-24 12:51:59'),
(105, 3045, '/uploads/products/3045/1779627147926-s96gxz3d.webp', 0, '2026-05-24 12:52:28'),
(106, 3035, '/uploads/products/3035/1779627177691-lrypipvq.webp', 0, '2026-05-24 12:52:58'),
(107, 3012, '/uploads/products/3012/1779627207136-p3ma0qmm.webp', 0, '2026-05-24 12:53:27'),
(108, 3023, '/uploads/products/3023/1779627238529-6lbnphg6.webp', 0, '2026-05-24 12:53:59'),
(109, 3006, '/uploads/products/3006/1779627260441-w8krqrcj.webp', 0, '2026-05-24 12:54:20');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `custom_quilt_requests`
--
ALTER TABLE `custom_quilt_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_number` (`request_number`),
  ADD KEY `idx_cqr_status` (`status`),
  ADD KEY `idx_cqr_created` (`created_at`),
  ADD KEY `idx_cqr_email` (`customer_email`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`),
  ADD KEY `fk_order_items_product` (`product_id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `page_products`
--
ALTER TABLE `page_products`
  ADD PRIMARY KEY (`page_id`,`product_id`),
  ADD KEY `fk_pp_product` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_products_sku` (`sku`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pi_product_sort` (`product_id`,`sort_order`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `custom_quilt_requests`
--
ALTER TABLE `custom_quilt_requests`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3051;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=110;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `page_products`
--
ALTER TABLE `page_products`
  ADD CONSTRAINT `fk_pp_page` FOREIGN KEY (`page_id`) REFERENCES `pages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_pi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
