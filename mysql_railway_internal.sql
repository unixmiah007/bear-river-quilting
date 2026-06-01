-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql.railway.internal:3306
-- Generation Time: Jun 01, 2026 at 09:41 PM
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
CREATE DATABASE IF NOT EXISTS `railway` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `railway`;

-- --------------------------------------------------------

--
-- Table structure for table `customize_wizard_config`
--

CREATE TABLE `customize_wizard_config` (
  `id` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `config_json` json NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `customize_wizard_config`
--

INSERT INTO `customize_wizard_config` (`id`, `config_json`, `updated_at`) VALUES
(1, '{\"pay\": {\"pauseSeconds\": 4}, \"page\": {\"intro\": \"Build your quilt step by step—pick a quilt from our catalog, set size and colors, then pay securely with Stripe to confirm your custom quilt request. Our designer will follow up within 2–3 business days with next steps.\", \"title\": \"Customize your quilt\", \"eyebrow\": \"Custom studio\"}, \"steps\": [{\"n\": 1, \"key\": \"design\", \"label\": \"Design\", \"title\": \"Choose a quilt to customize\", \"enabled\": true, \"description\": \"Select a published product from our catalog as your starting point. You\'ll choose size, colors, and batting in the next step.\", \"emptyProductsMessage\": \"No published products are available yet.\"}, {\"n\": 2, \"key\": \"options\", \"label\": \"Size & colors\", \"title\": \"Size, colors & batting\", \"enabled\": true, \"basedOnPrefix\": \"Based on\", \"estimatedPrefix\": \"— estimated starting at\", \"showSelectedProduct\": true}, {\"n\": 3, \"key\": \"vision\", \"label\": \"Your vision\", \"title\": \"Tell our designer your vision\", \"enabled\": true, \"notesLabel\": \"Notes for the designer\", \"quiltTitleLabel\": \"Working title (optional)\", \"notesPlaceholder\": \"Room colors, deadline, gift recipient, pattern tweaks, etc.\", \"quiltTitlePlaceholder\": \"e.g. Guest room sunset quilt\"}, {\"n\": 4, \"key\": \"contact\", \"label\": \"Contact\", \"title\": \"How can we reach you?\", \"enabled\": true, \"nameLabel\": \"Full name\", \"emailLabel\": \"Email\", \"phoneLabel\": \"Phone (optional)\"}, {\"n\": 5, \"key\": \"pay\", \"label\": \"Pay\", \"title\": \"Review & pay\", \"enabled\": true, \"finePrint\": \"Payment confirms your custom quilt request. Our designer may adjust the final scope or quote before production begins.\", \"stripeIntro\": \"You will be redirected to Stripe\'s secure checkout to pay {amount}. Test cards work in sandbox mode (for example 4242 4242 4242 4242).\", \"payButtonLabel\": \"Pay with Stripe\", \"countdownMessage\": \"Please review your order. Payment unlocks in {seconds}…\", \"payButtonBusyLabel\": \"Redirecting to Stripe…\", \"payButtonWaitingLabel\": \"Pay in {seconds}s…\"}], \"enabled\": true, \"defaults\": {\"batting\": \"cotton\", \"productSize\": \"large\", \"colorPalette\": \"warm-neutrals\"}, \"messages\": {\"priceError\": \"Could not calculate price for this design and size.\", \"chooseProduct\": \"Choose a product from the catalog to continue.\", \"wizardDisabled\": \"Custom quilt orders are temporarily unavailable. Please check back soon.\", \"contactRequired\": \"Enter your name and email so our designer can reach you.\", \"loadingProducts\": \"Loading products…\", \"selectDesignPay\": \"Select a design before paying.\", \"selectSizeColor\": \"Select a size and color palette.\", \"checkoutCancelled\": \"Payment was cancelled. Your design is saved — review and try again when ready.\"}, \"sections\": {\"sizes\": {\"display\": \"letter\", \"enabled\": true, \"heading\": \"Quilt size\"}, \"colors\": {\"display\": \"swatch\", \"enabled\": true, \"heading\": \"Color palette\"}, \"batting\": {\"display\": \"batting\", \"enabled\": true, \"heading\": \"Batting preference\"}}, \"sizeOptions\": [{\"code\": \"S\", \"hint\": \"Throw / lap · ~50\\\" × 65\\\"\", \"label\": \"Small\", \"value\": \"small\", \"enabled\": true}, {\"code\": \"L\", \"hint\": \"Full / queen · ~90\\\" × 90\\\"\", \"label\": \"Large\", \"value\": \"large\", \"enabled\": true}, {\"code\": \"XLarge\", \"hint\": \"Oversized queen · ~96\\\" × 96\\\"\", \"label\": \"X-Large\", \"value\": \"x-large\", \"enabled\": true}, {\"code\": \"XXLarge\", \"hint\": \"King · ~108\\\" × 96\\\"\", \"label\": \"XX-Large\", \"value\": \"xx-large\", \"enabled\": true}, {\"code\": \"XXXLarge\", \"hint\": \"Oversized king · ~110\\\" × 98\\\"\", \"label\": \"XXX-Large\", \"value\": \"xxx-large\", \"enabled\": true}], \"colorOptions\": [{\"hint\": \"Cream, tan, rust\", \"label\": \"Warm neutrals\", \"value\": \"warm-neutrals\", \"colors\": [\"#f7f2ea\", \"#e8d4b8\", \"#c9956a\", \"#a65d3f\"], \"enabled\": true}, {\"hint\": \"Soft blues & gray\", \"label\": \"Cool blues\", \"value\": \"cool-blues\", \"colors\": [\"#e8f1f8\", \"#9bb8d4\", \"#5a7fa3\", \"#6b7280\"], \"enabled\": true}, {\"hint\": \"Sage & forest tones\", \"label\": \"Sage greens\", \"value\": \"sage-greens\", \"colors\": [\"#e4ebe4\", \"#9cb39a\", \"#5f7d5c\", \"#3d5340\"], \"enabled\": true}, {\"hint\": \"Ruby, emerald, plum\", \"label\": \"Jewel tones\", \"value\": \"jewel-tones\", \"colors\": [\"#9b2335\", \"#1f6f54\", \"#5c2d6e\", \"#c9a227\"], \"enabled\": true}, {\"hint\": \"Black, white, gray\", \"label\": \"Monochrome\", \"value\": \"monochrome\", \"colors\": [\"#ffffff\", \"#d1d5db\", \"#6b7280\", \"#111111\"], \"enabled\": true}, {\"hint\": \"Mixed vibrant prints\", \"label\": \"Scrappy rainbow\", \"value\": \"scrappy-rainbow\", \"colors\": [\"#e63946\", \"#f4a261\", \"#e9c46a\", \"#2a9d8f\", \"#457b9d\", \"#9b5de5\"], \"enabled\": true, \"swatchLayout\": \"stripes\"}], \"battingOptions\": [{\"hint\": \"All-season, breathable\", \"image\": \"/assets/batting-cotton.svg\", \"label\": \"Cotton\", \"value\": \"cotton\", \"enabled\": true}, {\"hint\": \"Warm, lightweight loft\", \"image\": \"/assets/batting-wool.svg\", \"label\": \"Wool\", \"value\": \"wool\", \"enabled\": true}, {\"hint\": \"Silky, drapey hand\", \"image\": \"/assets/batting-bamboo.svg\", \"label\": \"Bamboo\", \"value\": \"bamboo\", \"enabled\": true}, {\"code\": \"?\", \"hint\": \"Designer recommendation\", \"label\": \"Not sure\", \"value\": \"unsure\", \"enabled\": true}]}', '2026-05-29 02:31:36');

-- --------------------------------------------------------

--
-- Table structure for table `custom_quilt_requests`
--

CREATE TABLE `custom_quilt_requests` (
  `id` int UNSIGNED NOT NULL,
  `request_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `acknowledged` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N',
  `design_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `design_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_size` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_palette` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `batting` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quilt_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `own_design_image_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_price` decimal(10,2) DEFAULT NULL,
  `stripe_checkout_session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_carrier` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tracking_notified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `custom_quilt_requests`
--

INSERT INTO `custom_quilt_requests` (`id`, `request_number`, `status`, `acknowledged`, `design_id`, `design_name`, `product_size`, `color_palette`, `batting`, `quilt_title`, `notes`, `own_design_image_url`, `customer_name`, `customer_email`, `customer_phone`, `estimated_price`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `tracking_carrier`, `tracking_number`, `tracking_notified_at`, `created_at`, `updated_at`) VALUES
(1, 'CQMPIJBR39366', 'submitted', 'Y', 'patchwork-heritage', 'Patchwork Heritage', 'large', 'warm-neutrals', 'cotton', 'test', 'test', NULL, 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', 289.00, NULL, NULL, NULL, NULL, NULL, '2026-05-23 16:00:20', '2026-05-29 04:02:54'),
(2, 'CQMPJL5SLN915', 'submitted', 'N', 'sunset-flying-geese', 'Sunset Flying Geese', 'x-large', 'sage-greens', 'wool', 'test', 'test', NULL, 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', 334.88, NULL, NULL, NULL, NULL, NULL, '2026-05-24 09:39:28', '2026-05-30 02:59:16'),
(3, 'CQMPNJPG0N293', 'submitted', 'N', 'modern-loft-stripe', 'Modern Loft Stripe', 'x-large', 'cool-blues', 'wool', NULL, NULL, NULL, 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', 357.28, NULL, NULL, NULL, NULL, NULL, '2026-05-27 04:09:50', '2026-05-30 02:59:20'),
(4, 'CQMPNLI32P605', 'submitted', 'N', 'patchwork-heritage', 'Patchwork Heritage', 'x-large', 'sage-greens', 'bamboo', NULL, NULL, NULL, 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', 323.68, NULL, NULL, NULL, NULL, NULL, '2026-05-27 05:00:06', '2026-05-30 02:59:21'),
(5, 'CQMPQB3UNT116', 'paid', 'N', 'product-3049', 'Cream Rail Fence Handmade Quilt', 'large', 'warm-neutrals', 'cotton', NULL, NULL, NULL, 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', 448.75, 'cs_test_a149tGpapkJpo3ljeVq5UdjtHsvFndYx9y2cxVfZs8LRQ4rSi5iC3tw3lZ', 'pi_3TcGE0BQe8WfAxpb1TlaMpd0', NULL, NULL, NULL, '2026-05-29 02:32:24', '2026-05-30 02:59:22'),
(6, 'CQMPRM1KLT970', 'paid', 'Y', 'product-3012', 'Rosewood Heritage Patchwork Handmade Quilt', 'small', 'warm-neutrals', 'cotton', NULL, NULL, NULL, 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', 338.04, 'cs_test_a1ToUpyiMFY603intpaJ62M7iiU4OIAqIxwUcHV3e7UaEAjWv5R0D6Z2vZ', 'pi_3TcajyBQe8WfAxpb26bvExKV', NULL, NULL, NULL, '2026-05-30 00:26:20', '2026-05-30 02:59:11'),
(7, 'CQMPRQKXR8229', 'pending_payment', 'N', 'product-3020', 'Dusk Riverstone Handmade Quilt', 'small', 'warm-neutrals', 'cotton', NULL, NULL, NULL, 'shajahan miah', 's@m.com', NULL, 163.60, 'cs_test_a1nlWbNytWWN3WbbIO7SNlPRpsHVJnShij2pBIJelSUGw3my9DHnIK8ztv', NULL, NULL, NULL, NULL, '2026-05-30 02:33:22', '2026-05-30 02:59:42'),
(8, 'CQMPTU1ARZ690', 'paid', 'N', 'product-3050', 'Stone Log Cabin Handmade Quilt', 'large', 'warm-neutrals', 'cotton', NULL, NULL, NULL, 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', 121.01, 'cs_test_a1qr3kOKcdp3BfSpbQAEM9LSvudGY2u20uCW4AVPXRD4x6fsXk0DVehnlj', 'pi_3Td9gTBQe8WfAxpb2IgXllFE', NULL, NULL, NULL, '2026-05-31 13:45:36', '2026-05-31 13:46:13'),
(9, 'CQMPTVY5CC869', 'shipped', 'N', 'product-3001', 'Oatmeal Modern Heirloom Handmade Quilt', 'standard', 'warm-neutrals', 'cotton', 'make it loose', 'make it a loose fit', '/uploads/customize-own-design/1780238316592-gpcu4s91.png', 'Nadim Badrul', 'nadimamin101@gmail.com', '5714365621', 180.98, 'cs_test_a1614jZ42d4vawC4gIgMGlv9TVViFsDhJ0rcf1EOBufJAtjmnZ3jieBYus', 'pi_3TdAWvBQe8WfAxpb0uK8sjCf', 'usps', '234234234234234', '2026-06-01 05:27:44', '2026-05-31 14:39:08', '2026-06-01 05:27:44'),
(10, 'CQMPUHDMFS907', 'paid', 'N', 'product-3052', 'Wintergreen Forest Warmth Quilt', 'xx-large', 'warm-neutrals', 'wool', NULL, NULL, '/uploads/customize-own-design/1780274310482-nfjm0s35.png', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', 166.00, 'cs_test_a1Ig71VzT0re8y6Etyb2oMwVWEyvQESmNIYkEaL081nasSDGzqlUH6qpWX', 'pi_3TdJtDBQe8WfAxpb2vUl3YPo', NULL, NULL, NULL, '2026-06-01 00:39:02', '2026-06-01 13:20:20');

-- --------------------------------------------------------

--
-- Table structure for table `media_assets`
--

CREATE TABLE `media_assets` (
  `id` int UNSIGNED NOT NULL,
  `path` varchar(512) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'upload',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `media_assets`
--

INSERT INTO `media_assets` (`id`, `path`, `filename`, `source`, `created_at`) VALUES
(1, '/uploads/products/3001/1779626968531-i6bqdx7l.webp', '1779626968531-i6bqdx7l.webp', 'scan', '2026-05-27 03:41:44'),
(2, '/uploads/products/3002/1779626576226-zqdsy5do.webp', '1779626576226-zqdsy5do.webp', 'scan', '2026-05-27 03:41:44'),
(3, '/uploads/products/3003/1779627034129-sxo89984.webp', '1779627034129-sxo89984.webp', 'scan', '2026-05-27 03:41:44'),
(4, '/uploads/products/3004/1779625651431-58eouaw8.webp', '1779625651431-58eouaw8.webp', 'scan', '2026-05-27 03:41:44'),
(5, '/uploads/products/3005/1779626139618-bbd4sf8w.webp', '1779626139618-bbd4sf8w.webp', 'scan', '2026-05-27 03:41:45'),
(6, '/uploads/products/3006/1779627260441-w8krqrcj.webp', '1779627260441-w8krqrcj.webp', 'scan', '2026-05-27 03:41:45'),
(7, '/uploads/products/3007/1779625509893-8g74ai1z.webp', '1779625509893-8g74ai1z.webp', 'scan', '2026-05-27 03:41:45'),
(8, '/uploads/products/3008/1779626197262-qkn8rs9o.webp', '1779626197262-qkn8rs9o.webp', 'scan', '2026-05-27 03:41:45'),
(9, '/uploads/products/3009/1779626618810-mau056ju.webp', '1779626618810-mau056ju.webp', 'scan', '2026-05-27 03:41:45'),
(10, '/uploads/products/3010/1779626345665-y72uv4nd.webp', '1779626345665-y72uv4nd.webp', 'scan', '2026-05-27 03:41:45'),
(11, '/uploads/products/3011/1779625896227-4rhye8jm.webp', '1779625896227-4rhye8jm.webp', 'scan', '2026-05-27 03:41:45'),
(12, '/uploads/products/3012/1779627207136-p3ma0qmm.webp', '1779627207136-p3ma0qmm.webp', 'scan', '2026-05-27 03:41:45'),
(13, '/uploads/products/3013/1779626798800-b3xps8qw.webp', '1779626798800-b3xps8qw.webp', 'scan', '2026-05-27 03:41:45'),
(14, '/uploads/products/3014/1779625765250-0pcqoohu.webp', '1779625765250-0pcqoohu.webp', 'scan', '2026-05-27 03:41:45'),
(15, '/uploads/products/3015/1779626176812-hauznb9k.webp', '1779626176812-hauznb9k.webp', 'scan', '2026-05-27 03:41:45'),
(16, '/uploads/products/3016/1779626370476-dsukve74.webp', '1779626370476-dsukve74.webp', 'scan', '2026-05-27 03:41:45'),
(17, '/uploads/products/3017/1779625989623-2uorm2nk.webp', '1779625989623-2uorm2nk.webp', 'scan', '2026-05-27 03:41:45'),
(18, '/uploads/products/3018/1779625701101-ovzhcg42.webp', '1779625701101-ovzhcg42.webp', 'scan', '2026-05-27 03:41:46'),
(19, '/uploads/products/3019/1779625725031-9ulratrt.webp', '1779625725031-9ulratrt.webp', 'scan', '2026-05-27 03:41:46'),
(20, '/uploads/products/3020/1779626060135-zh3i9nl2.webp', '1779626060135-zh3i9nl2.webp', 'scan', '2026-05-27 03:41:46'),
(21, '/uploads/products/3021/1779625563611-0y13x4fk.jpg', '1779625563611-0y13x4fk.jpg', 'scan', '2026-05-27 03:41:46'),
(22, '/uploads/products/3022/1779625630840-vgkwxs6f.webp', '1779625630840-vgkwxs6f.webp', 'scan', '2026-05-27 03:41:46'),
(23, '/uploads/products/3023/1779627238529-6lbnphg6.webp', '1779627238529-6lbnphg6.webp', 'scan', '2026-05-27 03:41:46'),
(24, '/uploads/products/3024/1779626495426-61n67sif.webp', '1779626495426-61n67sif.webp', 'scan', '2026-05-27 03:41:46'),
(25, '/uploads/products/3025/1779626391136-w7fbutrg.webp', '1779626391136-w7fbutrg.webp', 'scan', '2026-05-27 03:41:46'),
(26, '/uploads/products/3026/1779625536546-ustig3y0.webp', '1779625536546-ustig3y0.webp', 'scan', '2026-05-27 03:41:46'),
(27, '/uploads/products/3027/1779625954317-qencguip.webp', '1779625954317-qencguip.webp', 'scan', '2026-05-27 03:41:46'),
(28, '/uploads/products/3028/1779625813721-8trh8n9c.webp', '1779625813721-8trh8n9c.webp', 'scan', '2026-05-27 03:41:46'),
(29, '/uploads/products/3029/1779626318266-i8zfl59i.webp', '1779626318266-i8zfl59i.webp', 'scan', '2026-05-27 03:41:46'),
(30, '/uploads/products/3030/1779625746970-dxfbny8s.webp', '1779625746970-dxfbny8s.webp', 'scan', '2026-05-27 03:41:47'),
(31, '/uploads/products/3031/1779627002800-d2vywtus.webp', '1779627002800-d2vywtus.webp', 'scan', '2026-05-27 03:41:47'),
(32, '/uploads/products/3032/1779627119031-ov13e48n.webp', '1779627119031-ov13e48n.webp', 'scan', '2026-05-27 03:41:47'),
(33, '/uploads/products/3033/1779626438560-aql5ufn8.webp', '1779626438560-aql5ufn8.webp', 'scan', '2026-05-27 03:41:47'),
(34, '/uploads/products/3034/1779626896327-qb1848d4.webp', '1779626896327-qb1848d4.webp', 'scan', '2026-05-27 03:41:47'),
(35, '/uploads/products/3034/1779626948172-v7122jzj.webp', '1779626948172-v7122jzj.webp', 'scan', '2026-05-27 03:41:47'),
(36, '/uploads/products/3035/1779627177691-lrypipvq.webp', '1779627177691-lrypipvq.webp', 'scan', '2026-05-27 03:41:47'),
(37, '/uploads/products/3036/1779626645500-chmpvrsf.webp', '1779626645500-chmpvrsf.webp', 'scan', '2026-05-27 03:41:47'),
(38, '/uploads/products/3037/1779626462506-08dpzdz5.webp', '1779626462506-08dpzdz5.webp', 'scan', '2026-05-27 03:41:47'),
(39, '/uploads/products/3038/1779626835946-zfl8mlhp.webp', '1779626835946-zfl8mlhp.webp', 'scan', '2026-05-27 03:41:47'),
(40, '/uploads/products/3039/1779626548166-gxwyp0vp.webp', '1779626548166-gxwyp0vp.webp', 'scan', '2026-05-27 03:41:47'),
(41, '/uploads/products/3040/1779626924028-xpshrqbv.webp', '1779626924028-xpshrqbv.webp', 'scan', '2026-05-27 03:41:47'),
(42, '/uploads/products/3041/1779626676091-zf1o7wsl.jpg', '1779626676091-zf1o7wsl.jpg', 'scan', '2026-05-27 03:41:47'),
(43, '/uploads/products/3042/1779627093751-zft7rwc0.webp', '1779627093751-zft7rwc0.webp', 'scan', '2026-05-27 03:41:48'),
(44, '/uploads/products/3042/1779815900267-h8kgjes9.webp', '1779815900267-h8kgjes9.webp', 'scan', '2026-05-27 03:41:48'),
(45, '/uploads/products/3042/1779815900525-ri66it0g.webp', '1779815900525-ri66it0g.webp', 'scan', '2026-05-27 03:41:48'),
(46, '/uploads/products/3042/1779815901560-ltcz0d71.webp', '1779815901560-ltcz0d71.webp', 'scan', '2026-05-27 03:41:48'),
(47, '/uploads/products/3042/1779815901795-beqmeami.webp', '1779815901795-beqmeami.webp', 'scan', '2026-05-27 03:41:48'),
(48, '/uploads/products/3042/1779815901939-jofu751b.webp', '1779815901939-jofu751b.webp', 'scan', '2026-05-27 03:41:48'),
(49, '/uploads/products/3042/1779815902681-9959ov4j.webp', '1779815902681-9959ov4j.webp', 'scan', '2026-05-27 03:41:48'),
(50, '/uploads/products/3043/1779626527126-i2jafvhg.webp', '1779626527126-i2jafvhg.webp', 'scan', '2026-05-27 03:41:48'),
(51, '/uploads/products/3044/1779625793968-y99v88ad.webp', '1779625793968-y99v88ad.webp', 'scan', '2026-05-27 03:41:48'),
(52, '/uploads/products/3044/1779774004264-9y33l7ds.webp', '1779774004264-9y33l7ds.webp', 'scan', '2026-05-27 03:41:48'),
(53, '/uploads/products/3044/1779774004772-7jsezkst.webp', '1779774004772-7jsezkst.webp', 'scan', '2026-05-27 03:41:48'),
(54, '/uploads/products/3044/1779774005506-y75yj2j4.webp', '1779774005506-y75yj2j4.webp', 'scan', '2026-05-27 03:41:48'),
(55, '/uploads/products/3044/1779774005847-z365gmti.webp', '1779774005847-z365gmti.webp', 'scan', '2026-05-27 03:41:49'),
(56, '/uploads/products/3045/1779627147926-s96gxz3d.webp', '1779627147926-s96gxz3d.webp', 'scan', '2026-05-27 03:41:49'),
(57, '/uploads/products/3046/1779626111442-afwl9y4f.webp', '1779626111442-afwl9y4f.webp', 'scan', '2026-05-27 03:41:49'),
(58, '/uploads/products/3046/1779807276926-090zhzfm.webp', '1779807276926-090zhzfm.webp', 'scan', '2026-05-27 03:41:49'),
(59, '/uploads/products/3046/1779807277360-v4bez544.webp', '1779807277360-v4bez544.webp', 'scan', '2026-05-27 03:41:49'),
(60, '/uploads/products/3046/1779807278030-qz3lynck.jpg', '1779807278030-qz3lynck.jpg', 'scan', '2026-05-27 03:41:49'),
(61, '/uploads/products/3046/1779807280116-za4fakub.webp', '1779807280116-za4fakub.webp', 'scan', '2026-05-27 03:41:49'),
(62, '/uploads/products/3046/1779807281745-abvp74jl.webp', '1779807281745-abvp74jl.webp', 'scan', '2026-05-27 03:41:49'),
(63, '/uploads/products/3047/1779626039641-l4btfsab.webp', '1779626039641-l4btfsab.webp', 'scan', '2026-05-27 03:41:49'),
(64, '/uploads/products/3048/1779626158426-tsttjhm4.webp', '1779626158426-tsttjhm4.webp', 'scan', '2026-05-27 03:41:49'),
(65, '/uploads/products/3049/1779625871502-z4i6oeef.webp', '1779625871502-z4i6oeef.webp', 'scan', '2026-05-27 03:41:49'),
(66, '/uploads/products/3050/1779619403462-w01qnl0l.webp', '1779619403462-w01qnl0l.webp', 'scan', '2026-05-27 03:41:49'),
(67, '/uploads/media/1779853373964-huntzvch.jpg', '1779853373964-huntzvch.jpg', 'upload', '2026-05-27 03:43:04'),
(68, '/uploads/media/1779853374463-ny6genx1.jpg', '1779853374463-ny6genx1.jpg', 'upload', '2026-05-27 03:43:04'),
(69, '/uploads/media/1779853374658-v5xl62bi.jpg', '1779853374658-v5xl62bi.jpg', 'upload', '2026-05-27 03:43:05'),
(70, '/uploads/media/1779853374878-gte1bdb8.jpg', '1779853374878-gte1bdb8.jpg', 'upload', '2026-05-27 03:43:05'),
(71, '/uploads/media/1779853375473-o6zbqqmp.jpg', '1779853375473-o6zbqqmp.jpg', 'upload', '2026-05-27 03:43:05'),
(72, '/uploads/media/1779853376113-vg18j2qy.jpg', '1779853376113-vg18j2qy.jpg', 'upload', '2026-05-27 03:43:05'),
(73, '/uploads/media/1779853376778-bfc1hiik.jpg', '1779853376778-bfc1hiik.jpg', 'upload', '2026-05-27 03:43:05'),
(74, '/uploads/media/1779853378549-wovskakc.jpg', '1779853378549-wovskakc.jpg', 'upload', '2026-05-27 03:43:05'),
(75, '/uploads/media/1779853378822-gqdv333i.jpg', '1779853378822-gqdv333i.jpg', 'upload', '2026-05-27 03:43:05'),
(76, '/uploads/media/1779853379279-km6evejr.jpg', '1779853379279-km6evejr.jpg', 'upload', '2026-05-27 03:43:05'),
(77, '/uploads/media/1779853381079-nsw4syn0.jpg', '1779853381079-nsw4syn0.jpg', 'upload', '2026-05-27 03:43:05'),
(78, '/uploads/media/1779853381804-nqj87mc5.jpg', '1779853381804-nqj87mc5.jpg', 'upload', '2026-05-27 03:43:05'),
(79, '/uploads/media/1779853382929-oldjpsx5.jpg', '1779853382929-oldjpsx5.jpg', 'upload', '2026-05-27 03:43:05'),
(80, '/uploads/media/1779853383892-j4rd3a9a.jpg', '1779853383892-j4rd3a9a.jpg', 'upload', '2026-05-27 03:43:05'),
(81, '/uploads/products/3028/1779853418401-21cm1ss4.webp', '1779853418401-21cm1ss4.webp', 'scan', '2026-05-27 03:46:14'),
(82, '/uploads/products/3028/1779853418485-67vpzihm.webp', '1779853418485-67vpzihm.webp', 'scan', '2026-05-27 03:46:14'),
(83, '/uploads/media/1779853868986-n563desg.jpg', '1779853868986-n563desg.jpg', 'upload', '2026-05-27 03:51:16'),
(84, '/uploads/media/1779853869608-rycxhgkx.jpg', '1779853869608-rycxhgkx.jpg', 'upload', '2026-05-27 03:51:16'),
(85, '/uploads/media/1779853870014-u9f2diw5.jpg', '1779853870014-u9f2diw5.jpg', 'upload', '2026-05-27 03:51:16'),
(86, '/uploads/media/1779853870473-dwuoee2b.jpg', '1779853870473-dwuoee2b.jpg', 'upload', '2026-05-27 03:51:16'),
(87, '/uploads/media/1779853870993-v6imhw6p.jpg', '1779853870993-v6imhw6p.jpg', 'upload', '2026-05-27 03:51:16'),
(88, '/uploads/media/1779853871480-on1m14md.jpg', '1779853871480-on1m14md.jpg', 'upload', '2026-05-27 03:51:16'),
(89, '/uploads/media/1779853872008-zyxnyc6t.jpg', '1779853872008-zyxnyc6t.jpg', 'upload', '2026-05-27 03:51:16'),
(90, '/uploads/media/1779853872563-g510j5nc.jpg', '1779853872563-g510j5nc.jpg', 'upload', '2026-05-27 03:51:16'),
(91, '/uploads/media/1779853873088-1z3athji.jpg', '1779853873088-1z3athji.jpg', 'upload', '2026-05-27 03:51:17'),
(92, '/uploads/media/1779853873753-imr4njei.jpg', '1779853873753-imr4njei.jpg', 'upload', '2026-05-27 03:51:17'),
(93, '/uploads/media/1779853874238-e8tdl1pl.jpg', '1779853874238-e8tdl1pl.jpg', 'upload', '2026-05-27 03:51:17'),
(94, '/uploads/media/1779853875043-ddu7nzz0.jpg', '1779853875043-ddu7nzz0.jpg', 'upload', '2026-05-27 03:51:17'),
(95, '/uploads/products/3049/1779855053583-7emj7g95.jpg', '1779855053583-7emj7g95.jpg', 'scan', '2026-05-27 04:26:59'),
(96, '/uploads/products/3049/1779855053658-gs1jmyxy.jpg', '1779855053658-gs1jmyxy.jpg', 'scan', '2026-05-27 04:26:59'),
(97, '/uploads/media/1780156089187-6xg2502n.png', '1780156089187-6xg2502n.png', 'upload', '2026-05-30 15:48:13'),
(98, '/uploads/media/1780156200950-ci0qknuo.png', '1780156200950-ci0qknuo.png', 'upload', '2026-05-30 15:50:05'),
(99, '/uploads/media/1780156462690-ro7mn777.jpeg', '1780156462690-ro7mn777.jpeg', 'upload', '2026-05-30 15:54:26'),
(100, '/uploads/media/1780171907224-7wl67vra.png', '1780171907224-7wl67vra.png', 'upload', '2026-05-30 20:11:51'),
(101, '/uploads/media/1780171911948-ic5hvaqm.png', '1780171911948-ic5hvaqm.png', 'upload', '2026-05-30 20:11:57'),
(102, '/uploads/media/1780171917289-4ibvswpr.png', '1780171917289-4ibvswpr.png', 'upload', '2026-05-30 20:12:01'),
(103, '/uploads/media/1780171921883-r456xnjc.png', '1780171921883-r456xnjc.png', 'upload', '2026-05-30 20:12:07'),
(104, '/uploads/media/1780171927573-avfob30c.png', '1780171927573-avfob30c.png', 'upload', '2026-05-30 20:12:11'),
(105, '/uploads/media/1780171932259-8u2wvywf.png', '1780171932259-8u2wvywf.png', 'upload', '2026-05-30 20:12:17'),
(106, '/uploads/media/1780171937818-885zz011.png', '1780171937818-885zz011.png', 'upload', '2026-05-30 20:12:22'),
(107, '/uploads/media/1780171942883-4xri2mzt.png', '1780171942883-4xri2mzt.png', 'upload', '2026-05-30 20:12:27'),
(108, '/uploads/media/1780171947340-ddmuoa5n.png', '1780171947340-ddmuoa5n.png', 'upload', '2026-05-30 20:12:31'),
(109, '/uploads/media/1780171951967-twa0raw5.png', '1780171951967-twa0raw5.png', 'upload', '2026-05-30 20:12:36'),
(110, '/uploads/media/1780171956710-mv612uys.png', '1780171956710-mv612uys.png', 'upload', '2026-05-30 20:12:41'),
(111, '/uploads/media/1780171961303-95axsnd0.png', '1780171961303-95axsnd0.png', 'upload', '2026-05-30 20:12:46'),
(112, '/uploads/media/1780171966820-m5kbirdq.png', '1780171966820-m5kbirdq.png', 'upload', '2026-05-30 20:12:51'),
(113, '/uploads/media/1780171971474-cesklerc.png', '1780171971474-cesklerc.png', 'upload', '2026-05-30 20:12:55'),
(114, '/uploads/media/1780171976183-bnyu738b.png', '1780171976183-bnyu738b.png', 'upload', '2026-05-30 20:13:00'),
(115, '/uploads/media/1780171980803-c3okx7eh.png', '1780171980803-c3okx7eh.png', 'upload', '2026-05-30 20:13:05'),
(116, '/uploads/media/1780171985683-x0a4j3oq.png', '1780171985683-x0a4j3oq.png', 'upload', '2026-05-30 20:13:09'),
(117, '/uploads/media/1780171990048-e17z9rsl.png', '1780171990048-e17z9rsl.png', 'upload', '2026-05-30 20:13:15'),
(118, '/uploads/media/1780171995498-8eqkuzni.png', '1780171995498-8eqkuzni.png', 'upload', '2026-05-30 20:13:19'),
(119, '/uploads/media/1780172000163-32rkyybr.png', '1780172000163-32rkyybr.png', 'upload', '2026-05-30 20:13:25'),
(120, '/uploads/media/1780172005419-dvo68s1c.png', '1780172005419-dvo68s1c.png', 'upload', '2026-05-30 20:13:29'),
(121, '/uploads/media/1780172009711-pkwa1wjr.png', '1780172009711-pkwa1wjr.png', 'upload', '2026-05-30 20:13:34'),
(122, '/uploads/media/1780172014370-5tyaaick.png', '1780172014370-5tyaaick.png', 'upload', '2026-05-30 20:13:38'),
(123, '/uploads/media/1780172018307-6ev7ei55.png', '1780172018307-6ev7ei55.png', 'upload', '2026-05-30 20:13:42'),
(124, '/uploads/media/1780172022823-t99ir3t6.png', '1780172022823-t99ir3t6.png', 'upload', '2026-05-30 20:13:46'),
(125, '/uploads/media/1780172026865-luxudfin.png', '1780172026865-luxudfin.png', 'upload', '2026-05-30 20:13:51'),
(126, '/uploads/media/1780172031734-y6muliqf.png', '1780172031734-y6muliqf.png', 'upload', '2026-05-30 20:13:55'),
(127, '/uploads/media/1780172035872-koxu3gir.png', '1780172035872-koxu3gir.png', 'upload', '2026-05-30 20:14:00'),
(128, '/uploads/media/1780172040848-8zf181qn.png', '1780172040848-8zf181qn.png', 'upload', '2026-05-30 20:14:05'),
(129, '/uploads/media/1780172045654-9heyfzcy.png', '1780172045654-9heyfzcy.png', 'upload', '2026-05-30 20:14:10'),
(130, '/uploads/media/1780172050919-4ng08c61.png', '1780172050919-4ng08c61.png', 'upload', '2026-05-30 20:14:15'),
(131, '/uploads/media/1780172055958-dveilbvd.png', '1780172055958-dveilbvd.png', 'upload', '2026-05-30 20:14:20'),
(132, '/uploads/media/1780172060843-dfv6aw6s.png', '1780172060843-dfv6aw6s.png', 'upload', '2026-05-30 20:14:25'),
(133, '/uploads/media/1780172065718-bjfr56fy.png', '1780172065718-bjfr56fy.png', 'upload', '2026-05-30 20:14:30'),
(134, '/uploads/media/1780172070789-i8b191vj.png', '1780172070789-i8b191vj.png', 'upload', '2026-05-30 20:14:35'),
(135, '/uploads/media/1780172075883-o52a10lv.png', '1780172075883-o52a10lv.png', 'upload', '2026-05-30 20:14:40'),
(136, '/uploads/media/1780172080820-ayjksp03.png', '1780172080820-ayjksp03.png', 'upload', '2026-05-30 20:14:44'),
(137, '/uploads/media/1780172085333-rwitrj9q.png', '1780172085333-rwitrj9q.png', 'upload', '2026-05-30 20:14:50'),
(138, '/uploads/media/1780172090672-jhsbtm88.png', '1780172090672-jhsbtm88.png', 'upload', '2026-05-30 20:14:54'),
(139, '/uploads/media/1780172095150-7kzfx9af.png', '1780172095150-7kzfx9af.png', 'upload', '2026-05-30 20:15:00'),
(140, '/uploads/media/1780172100587-ab513itu.png', '1780172100587-ab513itu.png', 'upload', '2026-05-30 20:15:04'),
(141, '/uploads/media/1780172104959-btlscmwv.png', '1780172104959-btlscmwv.png', 'upload', '2026-05-30 20:15:09'),
(142, '/uploads/media/1780172109788-sbi6062b.png', '1780172109788-sbi6062b.png', 'upload', '2026-05-30 20:15:13'),
(143, '/uploads/media/1780172114145-zv660o8c.png', '1780172114145-zv660o8c.png', 'upload', '2026-05-30 20:15:18'),
(144, '/uploads/media/1780172119025-bt35ubp0.png', '1780172119025-bt35ubp0.png', 'upload', '2026-05-30 20:15:23'),
(145, '/uploads/media/1780172123431-hld0yt8b.png', '1780172123431-hld0yt8b.png', 'upload', '2026-05-30 20:15:27'),
(146, '/uploads/media/1780172128103-u52mh54s.png', '1780172128103-u52mh54s.png', 'upload', '2026-05-30 20:15:32'),
(147, '/uploads/media/1780172132573-xlqnrlic.png', '1780172132573-xlqnrlic.png', 'upload', '2026-05-30 20:15:36'),
(148, '/uploads/media/1780172137245-b3clu0pr.png', '1780172137245-b3clu0pr.png', 'upload', '2026-05-30 20:15:39'),
(149, '/uploads/media/1780172140420-rayl3jgt.png', '1780172140420-rayl3jgt.png', 'upload', '2026-05-30 20:15:43'),
(150, '/uploads/media/1780172143405-pv9nwoir.png', '1780172143405-pv9nwoir.png', 'upload', '2026-05-30 20:15:48'),
(151, '/uploads/media/1780172149223-ol2dwbcm.png', '1780172149223-ol2dwbcm.png', 'upload', '2026-05-30 20:15:56'),
(152, '/uploads/media/1780172157203-cm2bkhy9.png', '1780172157203-cm2bkhy9.png', 'upload', '2026-05-30 20:16:02'),
(153, '/uploads/media/1780172162349-sewsv6p5.png', '1780172162349-sewsv6p5.png', 'upload', '2026-05-30 20:16:07'),
(154, '/uploads/media/1780172167386-seqcmjvt.png', '1780172167386-seqcmjvt.png', 'upload', '2026-05-30 20:16:11'),
(155, '/uploads/media/1780172171703-j0zqz9dl.png', '1780172171703-j0zqz9dl.png', 'upload', '2026-05-30 20:16:16'),
(156, '/uploads/media/1780172176513-bb28u59k.png', '1780172176513-bb28u59k.png', 'upload', '2026-05-30 20:16:20'),
(157, '/uploads/media/1780172180745-5gqgk8lb.png', '1780172180745-5gqgk8lb.png', 'upload', '2026-05-30 20:16:25'),
(158, '/uploads/media/1780172185355-rlolfnhl.png', '1780172185355-rlolfnhl.png', 'upload', '2026-05-30 20:16:29'),
(159, '/uploads/media/1780172189548-fy6ltdgv.png', '1780172189548-fy6ltdgv.png', 'upload', '2026-05-30 20:16:33'),
(160, '/uploads/media/1780172194044-nkjhy9ug.png', '1780172194044-nkjhy9ug.png', 'upload', '2026-05-30 20:16:38'),
(161, '/uploads/media/1780172198453-gh5ajq1l.png', '1780172198453-gh5ajq1l.png', 'upload', '2026-05-30 20:16:43'),
(162, '/uploads/media/1780172203279-kh5wl3jq.png', '1780172203279-kh5wl3jq.png', 'upload', '2026-05-30 20:16:45'),
(163, '/uploads/media/1780172206268-behpki9e.png', '1780172206268-behpki9e.png', 'upload', '2026-05-30 20:16:49'),
(164, '/uploads/media/1780172209688-3tiak190.png', '1780172209688-3tiak190.png', 'upload', '2026-05-30 20:16:51'),
(165, '/uploads/media/1780172211988-p0qe0ymf.png', '1780172211988-p0qe0ymf.png', 'upload', '2026-05-30 20:16:55'),
(166, '/uploads/media/1780172215494-6nf7h3hf.png', '1780172215494-6nf7h3hf.png', 'upload', '2026-05-30 20:16:59'),
(167, '/uploads/media/1780172219884-q2tbbm4q.png', '1780172219884-q2tbbm4q.png', 'upload', '2026-05-30 20:17:04'),
(168, '/uploads/media/1780172224273-ci2w991m.png', '1780172224273-ci2w991m.png', 'upload', '2026-05-30 20:17:08'),
(169, '/uploads/media/1780172228983-hpt5ts4t.png', '1780172228983-hpt5ts4t.png', 'upload', '2026-05-30 20:17:13'),
(170, '/uploads/media/1780172233923-bjbylgdb.png', '1780172233923-bjbylgdb.png', 'upload', '2026-05-30 20:17:18'),
(171, '/uploads/media/1780172238578-sdchif12.png', '1780172238578-sdchif12.png', 'upload', '2026-05-30 20:17:22'),
(172, '/uploads/media/1780172243554-z1r40mfu.png', '1780172243554-z1r40mfu.png', 'upload', '2026-05-30 20:17:28'),
(173, '/uploads/media/1780172248265-ycugabcz.png', '1780172248265-ycugabcz.png', 'upload', '2026-05-30 20:17:32'),
(174, '/uploads/media/1780172252488-bla30vmr.png', '1780172252488-bla30vmr.png', 'upload', '2026-05-30 20:17:37'),
(175, '/uploads/media/1780172257789-gnq06zcu.png', '1780172257789-gnq06zcu.png', 'upload', '2026-05-30 20:17:43'),
(176, '/uploads/media/1780172264113-6ou4g38t.png', '1780172264113-6ou4g38t.png', 'upload', '2026-05-30 20:17:48'),
(177, '/uploads/media/1780172268623-p0awkvce.png', '1780172268623-p0awkvce.png', 'upload', '2026-05-30 20:17:53'),
(178, '/uploads/media/1780172274112-t6gzkgqj.png', '1780172274112-t6gzkgqj.png', 'upload', '2026-05-30 20:17:58'),
(179, '/uploads/media/1780172279023-v5h30our.png', '1780172279023-v5h30our.png', 'upload', '2026-05-30 20:18:03'),
(180, '/uploads/media/1780172284009-27g1y9aq.png', '1780172284009-27g1y9aq.png', 'upload', '2026-05-30 20:18:08'),
(181, '/uploads/media/1780172288798-8o0u2w5d.png', '1780172288798-8o0u2w5d.png', 'upload', '2026-05-30 20:18:14'),
(182, '/uploads/media/1780172294388-0a0safii.png', '1780172294388-0a0safii.png', 'upload', '2026-05-30 20:18:18'),
(183, '/uploads/media/1780172299198-gqur9nki.png', '1780172299198-gqur9nki.png', 'upload', '2026-05-30 20:18:24'),
(184, '/uploads/media/1780172304753-da1vtbc8.png', '1780172304753-da1vtbc8.png', 'upload', '2026-05-30 20:18:29'),
(185, '/uploads/media/1780172310153-fo5rpc4k.png', '1780172310153-fo5rpc4k.png', 'upload', '2026-05-30 20:18:36'),
(187, '/uploads/media/1780172321885-tudairfe.png', '1780172321885-tudairfe.png', 'upload', '2026-05-30 20:18:47'),
(188, '/uploads/media/1780172328108-3p5w2ho4.png', '1780172328108-3p5w2ho4.png', 'upload', '2026-05-30 20:18:52'),
(189, '/uploads/media/1780172333345-itz3vhlv.png', '1780172333345-itz3vhlv.png', 'upload', '2026-05-30 20:18:58'),
(190, '/uploads/media/1780172339138-o246v938.png', '1780172339138-o246v938.png', 'upload', '2026-05-30 20:19:03'),
(191, '/uploads/media/1780172344533-puhu1uf4.png', '1780172344533-puhu1uf4.png', 'upload', '2026-05-30 20:19:10'),
(192, '/uploads/products/3007/1780156279008-ueoabzmm.png', '1780156279008-ueoabzmm.png', 'scan', '2026-05-30 21:56:40'),
(194, '/uploads/products/3026/1780178377264-imouc1l3.png', '1780178377264-imouc1l3.png', 'scan', '2026-05-30 22:26:01'),
(195, '/uploads/products/3004/1780182657199-37v04aok.png', '1780182657199-37v04aok.png', 'scan', '2026-05-31 04:25:08'),
(196, '/uploads/products/3013/1780185739823-cphnkfm2.png', '1780185739823-cphnkfm2.png', 'scan', '2026-05-31 04:25:09'),
(197, '/uploads/products/3021/1780182602309-h03gshzz.png', '1780182602309-h03gshzz.png', 'scan', '2026-05-31 04:25:09'),
(198, '/uploads/products/3051/1780193491661-ttvdplcm.png', '1780193491661-ttvdplcm.png', 'scan', '2026-05-31 04:25:09'),
(199, '/uploads/products/3052/1780194348688-q361dq1d.png', '1780194348688-q361dq1d.png', 'scan', '2026-05-31 04:25:09'),
(200, '/uploads/products/3052/1780194349929-kdj2kwvm.png', '1780194349929-kdj2kwvm.png', 'scan', '2026-05-31 04:25:09'),
(201, '/uploads/customize-own-design/1780238316592-gpcu4s91.png', '1780238316592-gpcu4s91.png', 'scan', '2026-06-01 04:01:10'),
(202, '/uploads/customize-own-design/1780274310482-nfjm0s35.png', '1780274310482-nfjm0s35.png', 'scan', '2026-06-01 04:01:10');

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
  `tracking_notified_at` timestamp NULL DEFAULT NULL,
  `label_from_name` varchar(255) DEFAULT NULL,
  `label_from_address1` varchar(255) DEFAULT NULL,
  `label_from_address2` varchar(255) DEFAULT NULL,
  `label_from_city` varchar(120) DEFAULT NULL,
  `label_from_state` varchar(120) DEFAULT NULL,
  `label_from_postal_code` varchar(40) DEFAULT NULL,
  `label_from_country` varchar(120) DEFAULT NULL,
  `label_from_phone` varchar(64) DEFAULT NULL,
  `invoice_emailed_at` timestamp NULL DEFAULT NULL,
  `original_subtotal` decimal(10,2) DEFAULT NULL,
  `original_tax_amount` decimal(10,2) DEFAULT NULL,
  `original_total` decimal(10,2) DEFAULT NULL,
  `order_adjusted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `status`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address1`, `shipping_address2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `shipping_method`, `shipping_cost`, `billing_name`, `billing_address1`, `billing_address2`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `card_last4`, `subtotal`, `tax_amount`, `total`, `created_at`, `updated_at`, `payment_method`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `tracking_carrier`, `tracking_number`, `tracking_notified_at`, `label_from_name`, `label_from_address1`, `label_from_address2`, `label_from_city`, `label_from_state`, `label_from_postal_code`, `label_from_country`, `label_from_phone`, `invoice_emailed_at`, `original_subtotal`, `original_tax_amount`, `original_total`, `order_adjusted_at`) VALUES
(1, 'QMOZSNTVC263', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4999', 91.01, 7.51, 108.51, '2026-05-10 13:14:03', '2026-05-10 13:14:03', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'QMOZSRN13707', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4888', 418.75, 34.55, 463.29, '2026-05-10 13:17:01', '2026-05-10 13:17:01', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'QMOZSZH4Y339', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4888', 228.83, 18.88, 257.70, '2026-05-10 13:23:06', '2026-05-10 13:23:06', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'QMOZT3AW9715', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4999', 228.83, 18.88, 257.70, '2026-05-10 13:26:05', '2026-05-10 13:26:05', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'QMP0BT3JZ257', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '2000', 427.15, 35.24, 482.38, '2026-05-10 22:10:01', '2026-05-10 22:10:01', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 'QMP0C1YVY994', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4442', 418.75, 34.55, 473.29, '2026-05-10 22:16:55', '2026-05-10 22:16:55', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 'QMP0C8L00763', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4000', 228.83, 18.88, 257.70, '2026-05-10 22:22:04', '2026-05-26 17:10:01', 'manual', NULL, NULL, 'dhl', '32452353245', '2026-05-26 17:10:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 'QMP0CDIKW720', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '2000', 213.79, 17.64, 241.42, '2026-05-10 22:25:54', '2026-05-10 22:25:54', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 'QMP0CIBFP724', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '3000', 254.92, 21.03, 295.94, '2026-05-10 22:29:38', '2026-05-10 22:29:38', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 'QMP0LFZG4107', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4000', 254.92, 21.03, 295.94, '2026-05-11 02:39:46', '2026-05-11 02:39:46', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 'QMP1F3L6E383', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '4000', 228.83, 18.88, 257.70, '2026-05-11 16:29:56', '2026-05-11 16:29:56', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 'QMP1F8ABM346', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '5000', 228.83, 18.88, 257.70, '2026-05-11 16:33:35', '2026-05-11 16:33:35', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 'QMP1FB4UP627', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '7000', 254.92, 21.03, 285.94, '2026-05-11 16:35:48', '2026-05-11 16:35:48', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 'QMP1IM543161', 'pending', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 Holly Springs Drive', '', 'CHARLES TOWN', 'WV', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 Holly Springs Drive', '', 'CHARLES TOWN', 'WV', '25414', 'USA', '4888', 91.01, 7.51, 108.51, '2026-05-11 18:08:20', '2026-05-11 18:08:20', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 'QMP2SIPSQ920', 'paid', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '3999', 228.83, 18.88, 267.70, '2026-05-12 15:33:23', '2026-05-20 04:42:43', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 'QMP2SN3CS266', 'fulfilled', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5714365621', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '2999', 91.01, 7.51, 108.51, '2026-05-12 15:36:47', '2026-05-15 02:58:52', 'manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 'QMPG1NLE3454', 'fulfilled', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 528.32, 43.59, 581.90, '2026-05-21 22:10:07', '2026-05-26 05:30:59', 'stripe', 'cs_test_b1enVixGwpbAKtKkUORji6dwwuWDdfQKlmpg9gWwsNMRlB99LjmCklsOyB', 'pi_3TZenZBQe8WfAxpb29mgWmJi', 'fedex', '1YN2342342342', '2026-05-26 05:30:59', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 'QMPG24DBX966', 'paid', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 237.68, 19.61, 267.28, '2026-05-21 22:23:10', '2026-06-01 12:59:37', 'stripe', 'cs_test_b16wQT4gV1uPXwaO7S8MtJLMQqZfZg14tkezcOICkO1oM4olxL4ZM1yYlR', 'pi_3TZf07BQe8WfAxpb0fOdMpRP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'QMPGK4BW0491', 'fulfilled', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 120.00, 9.90, 149.89, '2026-05-22 06:47:01', '2026-06-01 15:48:45', 'stripe', 'cs_test_b1SFDSM3BHZogFozMB61KVTN2fEOQNrHGSh1ZgdFM7ZlPocZMQvHH1gGO4', 'pi_3TZmrmBQe8WfAxpb2m7mJ9wD', 'usps', '82934234234234234', '2026-05-23 16:07:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 91.01, 7.51, 118.51, '2026-06-01 15:48:18'),
(20, 'QMPGUWOAP738', 'shipped', 'Badrul Nadim ', 'aminbadrul101@gmail.com', '5716996447', '1204 w clay st ', '', 'Richmond ', 'VA', '23220', 'USA', 'standard', 9.99, 'Badrul Nadim ', '1204 w clay st ', '', 'Richmond ', 'VA', '23220', 'USA', 'STRP', 254.92, 21.03, 285.94, '2026-05-22 11:49:00', '2026-06-01 05:04:09', 'stripe', 'cs_test_b1nacPAO033RjXWEs1OQm8tVsJC7wJh67dbLQzdpTbaAZZuUHJZFslvURC', 'pi_3TZraYBQe8WfAxpb0aw794OS', 'fedex', '47463646477', '2026-06-01 05:04:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-30 00:24:28', NULL, NULL, NULL, NULL),
(21, 'QMPJVNXPZ866', 'paid', 'Susan Kelly', 'susa.k@gmail.com', '7187873777', '192 hople gallye road', '', 'Queens', 'NY', '10003', 'USA', 'standard', 9.99, 'Susan Kelly', '192 hople gallye road', '', 'Queens', 'NY', '10003', 'USA', 'STRP', 327.34, 27.01, 364.34, '2026-05-24 14:33:30', '2026-05-24 14:34:31', 'stripe', 'cs_test_b1H7jUUzXRAG7lTbVxGz272OCbdac7viuVIe7FVCGOGjEzrDnAhkm3mCF1', 'pi_3Tad6kBQe8WfAxpb0YN9bgFo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 'QMPKF918R588', 'fulfilled', 'test a1', 'asbg@gmail.com', '4565431234', 'twst1', '', 'sterling', 'va', '20166', 'USA', 'express', 19.99, 'test a1', 'twst1', '', 'sterling', 'va', '20166', 'USA', 'STRP', 418.75, 34.55, 473.29, '2026-05-24 23:41:47', '2026-05-24 23:44:41', 'stripe', 'cs_test_b1SYY9Yy9A33DAmmzvQljgjPLGvoFyTkWjTTp330HL2IwYRtYboRsj1POZ', 'pi_3TalfYBQe8WfAxpb1QBM33me', 'usps', '7776777677766', '2026-05-24 23:44:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 'QMPM2WJYW140', 'shipped', 'Tracy A.', 'tracyalto@brqllc.com', '800-472-7849', '88 Loudoun Country Blvd', '', 'Ashburn', 'VA', '20175', 'USA', 'express', 19.99, 'Tracy A.', '88 Loudoun Country Blvd', '', 'Ashburn', 'VA', '20175', 'USA', 'STRP', 377.27, 31.12, 428.38, '2026-05-26 03:31:42', '2026-06-01 05:04:37', 'stripe', 'cs_test_b1a4VE9hOURZdVHjq3I5y0OJUkmRe7iE3jOrph0uRH2RHuHxbKgVLN0tRN', 'pi_3TbBj9BQe8WfAxpb0vzH424L', 'ups', '1Z234234234234N', '2026-06-01 05:04:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-29 23:54:37', NULL, NULL, NULL, NULL),
(24, 'QMPM666S6108', 'paid', 'Joan Bujacich', 'fastguy199@gmail.com', '5712323123', '44 Drainville Road', '', 'Sterling', 'VA', '20166', 'USA', 'express', 19.99, 'Joan Bujacich', '44 Drainville Road', '', 'Sterling', 'VA', '20166', 'USA', 'STRP', 298.06, 24.59, 342.64, '2026-05-26 05:03:10', '2026-05-26 05:04:05', 'stripe', 'cs_test_b1pVhMldM1xBiBvrrQLwp7Fxz6CyAnNjWQ19J4vtAgDwiWGkIkBaf8dam6', 'pi_3TbD9oBQe8WfAxpb1sQcoeCT', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'QMPM6W2J8960', 'fulfilled', 'Molly Sanders', 'fastguy199@gmail.com', '7533223422', '55 Evergreen Milll Terrace', '', 'Broadlands', 'VA', '20175', 'USA', 'express', 19.99, 'Molly Sanders', '55 Evergreen Milll Terrace', '', 'Broadlands', 'VA', '20175', 'USA', 'STRP', 208.46, 17.20, 245.65, '2026-05-26 05:23:18', '2026-05-26 05:28:23', 'stripe', 'cs_test_b1bgTdZZGBw2KBHZua2b9Dch79T2JBv98h5rw7QsLrwwiqGIR52K6wXUBV', 'pi_3TbDTRBQe8WfAxpb2jWnrSuK', 'ups', '1Z23423423423424', '2026-05-26 05:28:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'QMPN1UT7Y125', 'fulfilled', 'Ted Grimes', 'shaj.k.miah@gmail.com', '5714365621', '10630 Provincial Drive', 'Apt B', 'Manassas', 'Virginia', '20109', 'USA', 'express', 19.99, 'Ted Grimes', '10630 Provincial Drive', 'Apt B', 'Manassas', 'Virginia', '20109', 'USA', 'STRP', 478.75, 39.50, 538.24, '2026-05-26 19:50:07', '2026-05-26 19:51:38', 'stripe', 'cs_test_b1T6b3EYwF78o6gdt05shR1XOFkzzqAw0SWgJKlwObviUbj5Eq39NnQ9ze', 'pi_3TbQzuBQe8WfAxpb2PedTTTl', 'usps', '9090384747374789', '2026-05-26 19:51:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 'QMPN28E7V414', 'fulfilled', 'Dan Sternfeld', 'fastguy199@gmail.com', '5715122599', '3835 Eldridge St', NULL, 'Detroit', 'MI', '48212-4180', 'USA', 'standard', 9.99, 'Dan Sternfeld', '3835 Eldridge St', '', 'Detroit', 'MI', '48212-4180', 'USA', 'STRP', 148.46, 12.25, 170.70, '2026-05-26 20:00:41', '2026-05-27 03:01:47', 'stripe', 'cs_test_b1aQSO8spOR9wzeBrHxdxIIOjgptSa1n0R6LpXzV3YRIMxR9pL6xkP7spy', 'pi_3TbR9oBQe8WfAxpb0rp8c7uw', 'ups', '1Z234234234234234', '2026-05-27 03:01:47', 'Bear River Quilting', '1200 Bear River Road', NULL, 'Logan', 'UT', '84321', 'United States', '1-800-472-7849', NULL, NULL, NULL, NULL, NULL),
(28, 'QMPO5F6AY154', 'preparing_for_shipment', 'Shajahan Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 151.01, 12.46, 183.46, '2026-05-27 14:17:42', '2026-06-01 05:01:58', 'stripe', 'cs_test_b1uP1CmA9q5j4atiBfO5TKnaDDLl5uYaytBqADG1lmnTbMQeX4AYIBpqvp', 'pi_3TbiHmBQe8WfAxpb2fYQKNHv', 'usps', '3893838998338398', '2026-05-28 10:40:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-29 23:17:07', NULL, NULL, NULL, NULL),
(29, 'QMPRJMD25796', 'paid', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 325.60, 26.86, 362.45, '2026-05-29 23:18:31', '2026-05-29 23:56:08', 'stripe', 'cs_test_b1pPwSASSxvAHYc0R6dtvDNwbemRYlBNmYhbwnfZpofI4t6PkBrhE3dWAk', 'pi_3TcZg3BQe8WfAxpb1nlr3Ox0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'QMPRN3WU5304', 'shipped', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 107.54, 8.87, 136.40, '2026-05-30 00:56:08', '2026-06-01 05:21:09', 'stripe', 'cs_test_b1MGhFc8khXkjqhRh1QMAjpFJsyYcONd9Jys4fbS5uPHkFudSTgyanb7UM', 'pi_3TcbCYBQe8WfAxpb0rTZdRIk', 'usps', '57957987767687', '2026-06-01 05:21:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 'QMPSHM7JH879', 'pending_payment', 'Shajahan Kabir Miah', 'shaj.k.miah@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', '----', 107.54, 8.87, 126.40, '2026-05-30 15:10:11', '2026-05-30 15:10:11', 'stripe', 'cs_test_b1wiRBQo0y9DnHQ9xfGWloXzpocObkOHiWoKE5mdsMR0lfML8UpFfriqRO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 'QMPV9D6MX188', 'paid', 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', '10630 Provincial Drive', 'Apt B', 'Manassas', 'California', '20109', 'USA', 'standard', 9.99, 'Shajahan Kabir Miah', '10630 Provincial Drive', 'Apt B', 'Manassas', 'California', '20109', 'USA', 'STRP', 739.59, 61.02, 810.60, '2026-06-01 13:42:31', '2026-06-01 21:19:21', 'stripe', 'cs_test_b1MaXkgRAgeeEkp8O4p1mJZ606VwUN5uKPqTIveFNmC8BGOtVcNw3bQrB4', 'pi_3TdW72BQe8WfAxpb1Hc6VDqU', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 140.00, 11.55, 161.54, '2026-06-01 21:19:21'),
(33, 'QMPV9F2O5789', 'paid', 'Shajahan Kabir Miah', 'fastguy199@gmail.com', '5715122599', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'express', 19.99, 'Shajahan Kabir Miah', '182 holly springs drive', '', 'Charles Town', 'West Virginia', '25414', 'USA', 'STRP', 441.39, 36.41, 497.79, '2026-06-01 13:43:59', '2026-06-01 19:08:00', 'stripe', 'cs_test_b1IZkNA4VxaKEXhzGmMJ5DsNFXqXKz4OLtWLFuEH3QyhEyE0qWrxzZ7byP', 'pi_3TdW8VBQe8WfAxpb09oILaqv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 91.01, 7.51, 118.51, '2026-06-01 15:26:52');

-- --------------------------------------------------------

--
-- Table structure for table `order_custom_payments`
--

CREATE TABLE `order_custom_payments` (
  `id` int UNSIGNED NOT NULL,
  `payment_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` int UNSIGNED DEFAULT NULL,
  `custom_quilt_request_id` int UNSIGNED DEFAULT NULL,
  `reference_type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'order',
  `order_number` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'usd',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `stripe_checkout_session_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checkout_url` text COLLATE utf8mb4_unicode_ci,
  `email_sent_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_custom_payments`
--

INSERT INTO `order_custom_payments` (`id`, `payment_number`, `order_id`, `custom_quilt_request_id`, `reference_type`, `order_number`, `customer_email`, `amount`, `currency`, `status`, `admin_note`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `checkout_url`, `email_sent_at`, `paid_at`, `created_at`, `updated_at`) VALUES
(1, 'CPMPTV1C7H598', 14, NULL, 'order', 'QMP1IM543161', 'shaj.k.miah@gmail.com', 45.00, 'usd', 'pending', 'There is an additional $45 charge', 'cs_test_a19iCpyXpCSLMknGGMcePx5Yo5ZkgxZb5TJahDQXXSFFNZw9w9x2B9a3bb', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a19iCpyXpCSLMknGGMcePx5Yo5ZkgxZb5TJahDQXXSFFNZw9w9x2B9a3bb#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-05-31 14:13:39', NULL, '2026-05-31 14:13:38', '2026-05-31 14:13:39'),
(2, 'CPMPTV3ZA1775', 23, NULL, 'order', 'QMPM2WJYW140', 'tracyalto@brqllc.com', 67.00, 'usd', 'pending', 'There is an additional $67 charge for multiple product shipping, please pay when you get a chance.', 'cs_test_a11K5KCnI7GEcO7kj5HxpK5IBjsg9d6aYx7zlmnPxYn5BhEpQleeGZcctD', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a11K5KCnI7GEcO7kj5HxpK5IBjsg9d6aYx7zlmnPxYn5BhEpQleeGZcctD#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-05-31 14:15:42', NULL, '2026-05-31 14:15:41', '2026-05-31 14:15:42'),
(3, 'CPMPTVZZZK607', NULL, 9, 'custom_quilt', 'CQMPTVY5CC869', 'nadimamin101@gmail.com', 40.00, 'usd', 'pending', 'you owe additional 40 for the custom request', 'cs_test_a1t8lkYmz4SSzNdqllIJnJGe92lShjF2770vZDIXJmg1iI59LTBF1jVXsj', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1t8lkYmz4SSzNdqllIJnJGe92lShjF2770vZDIXJmg1iI59LTBF1jVXsj#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-05-31 14:40:36', NULL, '2026-05-31 14:40:35', '2026-05-31 14:40:36'),
(4, 'CPMPTW6HGM321', NULL, 9, 'custom_quilt', 'CQMPTVY5CC869', 'nadimamin101@gmail.com', 90.00, 'usd', 'pending', 'you owe another $90 for fast shipping and quiltwork on top of what you paid. \n\nThank you.\nBRQ', 'cs_test_a1vHMQXhrN4s5ubd4WUupggx2e9N46TsLG2BrN65bZ5j7Yu4aAEF3dopKU', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1vHMQXhrN4s5ubd4WUupggx2e9N46TsLG2BrN65bZ5j7Yu4aAEF3dopKU#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-05-31 14:45:38', NULL, '2026-05-31 14:45:37', '2026-05-31 14:45:38'),
(5, 'CPMPTX3ETP802', 23, NULL, 'order', 'QMPM2WJYW140', 'tracyalto@brqllc.com', 28.38, 'usd', 'pending', 'Adjusted balance after express shipping for multiple products.', 'cs_test_a1wKsF9JxloVmnz8I9XtyGdhPr3hmf9Y9yHSnOjkCsdf4Vm4ZnAD72GLz3', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1wKsF9JxloVmnz8I9XtyGdhPr3hmf9Y9yHSnOjkCsdf4Vm4ZnAD72GLz3#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-05-31 15:11:15', NULL, '2026-05-31 15:11:14', '2026-05-31 15:11:15'),
(6, 'CPMPVD3DXZ288', 33, NULL, 'order', 'QMPV9F2O5789', 'fastguy199@gmail.com', 55.24, 'usd', 'pending', 'Additional amount due after your order QMPV9F2O5789 was updated (product change on line item).', 'cs_test_a1iHuyyPGeyF4p3BkdEvfK6X7ynmxh5qXXYaOCHdENrcTVQ7XXvUEpVJ0c', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1iHuyyPGeyF4p3BkdEvfK6X7ynmxh5qXXYaOCHdENrcTVQ7XXvUEpVJ0c#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-06-01 15:26:54', NULL, '2026-06-01 15:26:53', '2026-06-01 15:26:54'),
(7, 'CPMPVD6TQC151', 33, NULL, 'order', 'QMPV9F2O5789', 'fastguy199@gmail.com', 93.95, 'usd', 'pending', 'Additional amount due after your order QMPV9F2O5789 was updated (product change on line item).', 'cs_test_a1hDf8dtC80fhXb38ewKvhBJEVsqFB3pKz61eOttZuzuDjPTBKw1lghs9A', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1hDf8dtC80fhXb38ewKvhBJEVsqFB3pKz61eOttZuzuDjPTBKw1lghs9A#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-06-01 15:29:34', NULL, '2026-06-01 15:29:33', '2026-06-01 15:29:34'),
(8, 'CPMPVDUYDH462', 19, NULL, 'order', 'QMPGK4BW0491', 'shaj.k.miah@gmail.com', 379.28, 'usd', 'pending', 'Additional amount due after your order QMPGK4BW0491 was updated (product change on line item).', 'cs_test_a1l6qIDIbVjPXrPbzmwInHfe72f2P0xvHndyN9PQoVE1bG5WrYSxkl1LhX', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1l6qIDIbVjPXrPbzmwInHfe72f2P0xvHndyN9PQoVE1bG5WrYSxkl1LhX#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-06-01 15:48:20', NULL, '2026-06-01 15:48:19', '2026-06-01 15:48:20'),
(9, 'CPMPVKZRIC632', 33, NULL, 'order', 'QMPV9F2O5789', 'fastguy199@gmail.com', 230.09, 'usd', 'pending', 'Additional amount due after your order QMPV9F2O5789 was updated (product change on line item).', 'cs_test_a1Y5GHy2YA8oP3ssTEsHrRlrOTkgozjMwsOij48qcHg82tWi12ahD0tzA9', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1Y5GHy2YA8oP3ssTEsHrRlrOTkgozjMwsOij48qcHg82tWi12ahD0tzA9#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-06-01 19:08:01', NULL, '2026-06-01 19:08:00', '2026-06-01 19:08:01'),
(10, 'CPMPVPPDJQ207', 32, NULL, 'order', 'QMPV9D6MX188', 'fastguy199@gmail.com', 649.06, 'usd', 'pending', 'Additional amount due for Bear River Quilting order QMPV9D6MX188.', 'cs_test_a1L6EawFIg9dkd2Zybe9ZhnvLzXqe9mOjpdoYv33RrFf2P9cdbLH8Ow2Ng', NULL, 'https://checkout.stripe.com/c/pay/cs_test_a1L6EawFIg9dkd2Zybe9ZhnvLzXqe9mOjpdoYv33RrFf2P9cdbLH8Ow2Ng#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicGRmZGhqaWBTZHdsZGtxJz8nZmprcXdqaScpJ2R1bE5gfCc%2FJ3VuWnFgdnFaMDRRX1Ixf0dUYD1SY0R9dWdDNUxnQmZTN00zRmJcZzJRd2JtNEFUSnZgf2RLNlBrT3xGNDYwcm1QaVxUSUB1fzNGYXVyY1xwbWtPT21rfW19cXxTUjZnXDI1NWNIVGlUQWJ0JyknY3dqaFZgd3Ngdyc%2FcXdwYCknZ2RmbmJ3anBrYUZqaWp3Jz8nJmNjY2NjYycpJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl', '2026-06-01 21:19:55', NULL, '2026-06-01 21:19:54', '2026-06-01 21:19:55');

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
  `line_total` decimal(10,2) NOT NULL,
  `line_refund_amount` decimal(10,2) DEFAULT NULL,
  `line_refund_status` varchar(16) DEFAULT NULL,
  `stripe_refund_id` varchar(255) DEFAULT NULL,
  `line_refund_at` timestamp NULL DEFAULT NULL,
  `original_product_id` int UNSIGNED DEFAULT NULL,
  `original_product_name` varchar(255) DEFAULT NULL,
  `original_unit_price` decimal(10,2) DEFAULT NULL,
  `original_line_total` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `line_total`, `line_refund_amount`, `line_refund_status`, `stripe_refund_id`, `line_refund_at`, `original_product_id`, `original_product_name`, `original_unit_price`, `original_line_total`) VALUES
(1, 1, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 2, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 3, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 4, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 5, 3043, 'Ivory Autumn Leaf Handmade Quilt', 427.15, 1, 427.15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 6, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 7, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(8, 8, 3034, 'Sage Autumn Leaf Handmade Quilt', 213.79, 1, 213.79, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, 9, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 10, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 11, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 12, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 13, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, 14, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 15, 3044, 'Terracotta Winterberry Handmade Quilt', 228.83, 1, 228.83, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 16, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 1, 91.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 17, 3007, 'Amber Artisan Diamond Handmade Quilt', 118.46, 1, 118.46, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 17, 3016, 'Spruce Rail Fence Handmade Quilt', 409.86, 1, 409.86, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 18, 3005, 'Fig Soft Loom Handmade Quilt', 237.68, 1, 237.68, 196.01, 'issued', 're_3TZf07BQe8WfAxpb0BOvQvXk', '2026-06-01 12:59:38', NULL, NULL, NULL, NULL),
(20, 19, 3051, 'Autumn Breeze Warmth Quilt', 120.00, 1, 120.00, 347.90, 'failed', NULL, NULL, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 91.01),
(21, 20, 3046, 'Fig Dresden Plate Handmade Quilt', 254.92, 1, 254.92, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 21, 3042, 'Rosewood Velvet Horizon Handmade Quilt', 327.34, 1, 327.34, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(23, 22, 3049, 'Cream Rail Fence Handmade Quilt', 418.75, 1, 418.75, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(24, 23, 3037, 'Indigo Rail Fence Handmade Quilt (XX-Large)', 377.27, 1, 377.27, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(26, 25, 3007, 'Amber Artisan Diamond Handmade Quilt (XX-Large)', 208.46, 1, 208.46, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(27, 26, 3049, 'Cream Rail Fence Handmade Quilt (X-Large)', 478.75, 1, 478.75, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(28, 27, 3007, 'Amber Artisan Diamond Handmade Quilt (Large)', 148.46, 1, 148.46, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(29, 28, 3050, 'Stone Log Cabin Handmade Quilt (X-Large)', 151.01, 1, 151.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 29, 3041, 'Ivory Riverstone Handmade Quilt (X-Large)', 325.60, 1, 325.60, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, 32, 3051, 'Autumn Breeze Warmth Quilt (Large)', 140.00, 1, 140.00, NULL, NULL, NULL, NULL, 3051, 'Autumn Breeze Warmth Quilt (Large)', 140.00, 140.00),
(34, 33, 3048, 'Terracotta Summit Cross Handmade Quilt', 441.39, 1, 441.39, NULL, NULL, NULL, NULL, 3050, 'Stone Log Cabin Handmade Quilt', 91.01, 91.01),
(35, 32, 3026, 'Amber Dresden Plate Handmade Quilt (Small)', 400.37, 1, 400.37, NULL, NULL, NULL, NULL, 3026, 'Amber Dresden Plate Handmade Quilt (Small)', 400.37, 400.37),
(36, 32, 3019, 'Blush Cathedral Window Handmade Quilt (Small)', 199.22, 1, 199.22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_messages`
--

CREATE TABLE `order_messages` (
  `id` int UNSIGNED NOT NULL,
  `order_id` int UNSIGNED NOT NULL,
  `direction` varchar(32) NOT NULL DEFAULT 'staff_to_customer',
  `from_email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `body_text` text NOT NULL,
  `body_html` mediumtext NOT NULL,
  `to_email` varchar(255) NOT NULL,
  `email_sent` tinyint(1) NOT NULL DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_messages`
--

INSERT INTO `order_messages` (`id`, `order_id`, `direction`, `from_email`, `subject`, `body_text`, `body_html`, `to_email`, `email_sent`, `sent_at`, `created_at`) VALUES
(1, 23, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPM2WJYW140', 'Hello, we are preparing your order.', 'Hello, we are preparing your order.', 'tracyalto@brqllc.com', 1, '2026-05-27 05:17:50', '2026-05-27 05:17:50'),
(2, 14, 'customer_to_staff', 'shaj.k.miah@gmail.com', 'Re: Order QMP1IM543161', 'Hello, I did not receive my order.', 'Hello, I did not receive my order.', 'shaj.k.miah@gmail.com', 1, '2026-05-27 05:18:48', '2026-05-27 05:18:47'),
(3, 14, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMP1IM543161', 'We are in the processing of preparing your order.', 'We are in the processing of preparing your order.', 'shaj.k.miah@gmail.com', 1, '2026-05-27 05:19:38', '2026-05-27 05:19:38'),
(4, 25, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPM6W2J8960', 'Test', 'Test', 'fastguy199@gmail.com', 1, '2026-05-27 05:28:48', '2026-05-27 05:28:48'),
(5, 20, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPGUWOAP738', 'There is a slight delay on your order but we are working on it.', 'There is a slight delay on your order but we are working on it.', 'aminbadrul101@gmail.com', 1, '2026-05-27 14:03:23', '2026-05-27 14:03:23'),
(6, 20, 'customer_to_staff', 'aminbadrul101@gmail.com', 'Re: Order QMPGUWOAP738', 'thank you for letting us know.', 'thank you for letting us know.', 'shaj.k.miah@gmail.com', 1, '2026-05-27 14:04:58', '2026-05-27 14:04:58'),
(7, 23, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPM2WJYW140', 'Test message\n----\nYour order has been shipped and a tracking number has been provided, let us know if you need anything else.', 'Test message<br>\n----<br>\nYour order has been shipped and a tracking number has been provided, let us know if you need anything else.', 'tracyalto@brqllc.com', 1, '2026-05-28 10:42:18', '2026-05-28 10:42:17'),
(8, 20, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPGUWOAP738', 'This is a test message: \nYour order has been shipped and a tracking number has been provided--- let us know if you need anything else.', 'This is a test message: <br>\nYour order has been shipped and a tracking number has been provided--- let us know if you need anything else.', 'aminbadrul101@gmail.com', 1, '2026-05-28 10:53:42', '2026-05-28 10:53:41'),
(9, 20, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPGUWOAP738', 'test', 'test', 'aminbadrul101@gmail.com', 1, '2026-05-30 00:24:10', '2026-05-30 00:24:10'),
(10, 31, 'staff_to_customer', 'shaj.k.miah@gmail.com', 'Message about your order QMPSHM7JH879', 'hi this is a test.', 'hi this is a test.', 'shaj.k.miah@gmail.com', 1, '2026-06-01 00:42:20', '2026-06-01 00:42:19'),
(11, 32, 'customer_to_staff', 'fastguy199@gmail.com', 'Re: Order QMPV9D6MX188', 'hi-- could you ship faster?', 'hi-- could you ship faster?', 'shaj.k.miah@gmail.com', 1, '2026-06-01 21:22:57', '2026-06-01 21:22:57');

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
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_published` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pages`
--

INSERT INTO `pages` (`id`, `slug`, `title`, `body`, `created_at`, `updated_at`, `is_published`) VALUES
(2, 'summer-collection-50-off', 'Summer Collection 50% Off', 'Summer Collection 50% Off. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', '2026-05-26 04:55:42', '2026-06-01 13:58:41', 1),
(3, 'flash-40-off-sale', 'Flash 40% Off Sale', '<p>Flash <strong>40% Off Sale</strong>. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudianda.</p>', '2026-05-26 04:57:12', '2026-05-29 01:33:53', 1),
(4, 'heritage-quilts', 'Heritage quilts', '<p>Heritage quilts are quilts valued for their craftsmanship, historical patterns, and the stories or traditions they carry across generations. They are often handmade or inspired by historical quilting techniques, using patterns that have been passed down through families or quilting communities for decades or even centuries.</p><p>Common characteristics of heritage quilts include:</p><p><br></p><ul><li><strong>Traditional patterns</strong> such as Log Cabin, Nine Patch, Flying Geese, and Dresden Plate.</li><li><strong>Hand quilting and piecing</strong>, though some modern heritage quilts combine machine stitching with traditional designs.</li><li><strong>Natural or heirloom-quality fabrics</strong>, including cotton, wool, or reproduction prints inspired by 19th- and early 20th-century textiles.</li><li><strong>Family significance</strong>, where quilts are created for weddings, births, anniversaries, or passed down as heirlooms.</li></ul><p>Many heritage quilts also reflect regional and cultural traditions. For example:</p><p><br></p><ul><li>Amish quilts are known for bold geometric patterns and solid colors.</li><li>Gee\'s Bend quilts are celebrated for their improvisational style and cultural importance.</li><li>Baltimore Album quilts feature intricate appliqué blocks and elaborate handwork.</li></ul><p>Here are a few examples of heritage quilt styles and details:</p><p>Traditional patchwork quilts</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p>Amish and folk-art influenced quilts</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p>Today, many quilters blend heritage aesthetics with modern colors and fabrics, keeping traditional quilting alive while creating pieces that work in contemporary homes.</p>', '2026-05-29 13:48:35', '2026-05-29 13:48:35', 1),
(5, 'modern-loft-quilts', 'Modern loft quilts', '<p>Modern loft quilts are quilts designed to complement modern urban interiors such as loft apartments, industrial spaces, and contemporary homes. Unlike traditional heritage quilts, modern loft quilts emphasize clean lines, bold geometry, minimalism, and sophisticated color palettes.</p><p>Key features of modern loft quilts include:</p><p><br></p><ul><li><strong>Minimalist design</strong> with simple layouts and negative space.</li><li><strong>Geometric patterns</strong> like stripes, asymmetry, grids, and abstract blocks.</li><li><strong>Modern color palettes</strong> including monochrome tones, earthy neutrals, charcoal, rust, olive, navy, or muted pastels.</li><li><strong>High loft batting or textured finishes</strong>, giving the quilt a plush, cozy appearance while maintaining a sleek aesthetic.</li><li><strong>Mix of traditional and modern techniques</strong>, often using machine quilting for precision.</li></ul><p>Modern loft quilts are popular in interiors inspired by:</p><p><br></p><ul><li>Industrial loft design</li><li>Scandinavian minimalism</li><li>Mid-century modern decor</li><li>Contemporary urban apartments</li></ul><p>Examples of modern loft quilt aesthetics:</p><p>Minimalist geometric quilts</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p>Industrial and Scandinavian-inspired quilt styles</p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p><br></p><p>Many modern quilt makers also focus on sustainability, using organic fabrics, recycled textiles, or small-batch handcrafted production while still delivering a refined, designer-inspired look.</p>', '2026-05-29 13:51:48', '2026-05-29 13:51:48', 1);

-- --------------------------------------------------------

--
-- Table structure for table `page_products`
--

CREATE TABLE `page_products` (
  `page_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `page_products`
--

INSERT INTO `page_products` (`page_id`, `product_id`, `sort_order`) VALUES
(2, 3004, 2),
(2, 3021, 0),
(2, 3051, 3),
(3, 3007, 0),
(3, 3021, 2),
(3, 3026, 1),
(4, 3004, 2),
(4, 3005, 3),
(4, 3026, 0),
(5, 3009, 0),
(5, 3024, 3),
(5, 3034, 2),
(5, 3036, 1);

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
  `size_prices` json DEFAULT NULL,
  `stock_quantity` int UNSIGNED NOT NULL DEFAULT '0',
  `product_size` varchar(32) DEFAULT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `sku`, `name`, `description`, `price`, `size_prices`, `stock_quantity`, `product_size`, `image_url`, `is_published`, `is_featured`, `created_at`, `updated_at`) VALUES
(3001, 'BRQ-3001', 'Oatmeal Modern Heirloom Handmade Quilt', 'Full/Queen medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 180.98, NULL, 70, NULL, '/uploads/products/3001/1779626968531-i6bqdx7l.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:49:30'),
(3002, 'BRQ-3002', 'Spruce Bargello Waves Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 184.11, NULL, 49, NULL, '/uploads/products/3002/1779626576226-zqdsy5do.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:42:58'),
(3003, 'BRQ-3003', 'Rosewood Willow Stitch Handmade Quilt', 'Full/Queen plush handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 291.02, NULL, 29, NULL, '/uploads/products/3003/1779627034129-sxo89984.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:50:36'),
(3004, 'BRQ-3004', 'Amber Patchwork Star Handmade Quilt', '<p>Full/Queen medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.</p>', 348.30, '{\"large\": 378.3, \"small\": 348.3, \"x-large\": 408.3, \"xx-large\": 438.3, \"xxx-large\": 468.3}', 78, NULL, '/uploads/products/3004/1780182657199-37v04aok.png', 1, 1, '2026-05-10 13:09:22', '2026-05-31 13:09:27'),
(3005, 'BRQ-3005', 'Fig Soft Loom Handmade Quilt', 'King medium loft handmade quilt with bamboo fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 237.68, NULL, 73, NULL, '/uploads/products/3005/1779626139618-bbd4sf8w.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:35:41'),
(3006, 'BRQ-3006', 'Pearl Linen Field Handmade Quilt', 'Throw lightweight handmade quilt with wool blend fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 221.38, NULL, 46, NULL, '/uploads/products/3006/1779627260441-w8krqrcj.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:54:22'),
(3007, 'BRQ-3007', 'Amber Artisan Diamond Handmade Quilt', '<p>Full/Queen plush handmade quilt with wool blend fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.</p>', 118.46, '{\"large\": 148.46, \"small\": 118.46, \"x-large\": 178.46, \"xx-large\": 208.46, \"xxx-large\": 238.46}', 31, 'large', '/uploads/products/3007/1780156279008-ueoabzmm.png', 1, 1, '2026-05-10 13:09:22', '2026-05-30 15:51:35'),
(3008, 'BRQ-3008', 'Stone Cotton Cloud Handmade Quilt', 'Full/Queen all-season handmade quilt with bamboo fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 265.16, NULL, 81, NULL, '/uploads/products/3008/1779626197262-qkn8rs9o.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:36:40'),
(3009, 'BRQ-3009', 'Slate Winterberry Handmade Quilt', 'Full/Queen lightweight handmade quilt with wool blend fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 227.14, NULL, 85, NULL, '/uploads/products/3009/1779626618810-mau056ju.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:43:40'),
(3010, 'BRQ-3010', 'Terracotta Artisan Diamond Handmade Quilt', 'Twin plush handmade quilt with cotton fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 142.04, NULL, 31, NULL, '/uploads/products/3010/1779626345665-y72uv4nd.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:39:08'),
(3011, 'BRQ-3011', 'Cream Sunrise Patch Handmade Quilt', 'Twin lightweight handmade quilt with bamboo fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 432.73, NULL, 72, NULL, '/uploads/products/3011/1779625896227-4rhye8jm.webp', 1, 1, '2026-05-10 13:09:22', '2026-05-26 04:35:43'),
(3012, 'BRQ-3012', 'Rosewood Heritage Patchwork Handmade Quilt', 'King plush handmade quilt with microfiber fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 338.04, NULL, 87, NULL, '/uploads/products/3012/1779627207136-p3ma0qmm.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:53:29'),
(3013, 'BRQ-3013', 'Mist Cottage Stripe Handmade Quilt', '<p>King medium loft handmade quilt with wool blend fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.</p>', 291.65, '{\"large\": 321.65, \"small\": 291.65, \"x-large\": 351.65, \"xx-large\": 381.65, \"xxx-large\": 411.65}', 76, NULL, '/uploads/products/3013/1780185739823-cphnkfm2.png', 1, 0, '2026-05-10 13:09:22', '2026-05-31 00:05:58'),
(3014, 'BRQ-3014', 'Cream Dresden Plate Handmade Quilt', 'Twin lightweight handmade quilt with wool blend fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 105.73, NULL, 98, NULL, '/uploads/products/3014/1779625765250-0pcqoohu.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:29:27'),
(3015, 'BRQ-3015', 'Stone Soft Loom Handmade Quilt', 'Full/Queen medium loft handmade quilt with microfiber fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 195.57, NULL, 72, NULL, '/uploads/products/3015/1779626176812-hauznb9k.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:36:18'),
(3016, 'BRQ-3016', 'Spruce Rail Fence Handmade Quilt', 'King lightweight handmade quilt with microfiber fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 409.86, NULL, 51, 'xx-large', '/uploads/products/3016/1779626370476-dsukve74.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:39:33'),
(3018, 'BRQ-3018', 'Amber Velvet Horizon Handmade Quilt', 'Throw all-season handmade quilt with bamboo fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 329.02, NULL, 91, NULL, '/uploads/products/3018/1779625701101-ovzhcg42.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:28:22'),
(3019, 'BRQ-3019', 'Blush Cathedral Window Handmade Quilt', 'King lightweight handmade quilt with bamboo fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 199.22, NULL, 99, NULL, '/uploads/products/3019/1779625725031-9ulratrt.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:28:47'),
(3020, 'BRQ-3020', 'Dusk Riverstone Handmade Quilt', 'King plush handmade quilt with bamboo fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 163.60, NULL, 48, 'xxx-large', '/uploads/products/3020/1779626060135-zh3i9nl2.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:34:23'),
(3021, 'BRQ-3021', 'Amber Garden Path Handmade Quilt', '<p>King all-season handmade quilt with wool blend fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.</p>', 301.37, '{\"large\": 331.37, \"small\": 301.37, \"x-large\": 361.37, \"xx-large\": 391.37, \"xxx-large\": 421.37}', 60, 'small', '/uploads/products/3021/1779625563611-0y13x4fk.jpg', 1, 0, '2026-05-10 13:09:22', '2026-05-30 23:10:15'),
(3023, 'BRQ-3023', 'Pearl Rail Fence Handmade Quilt', 'King all-season handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 162.01, NULL, 71, NULL, '/uploads/products/3023/1779627238529-6lbnphg6.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:54:01'),
(3024, 'BRQ-3024', 'Spruce Prairie Weave Handmade Quilt', 'King all-season handmade quilt with bamboo fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 175.50, NULL, 62, NULL, '/uploads/products/3024/1779626495426-61n67sif.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:41:37'),
(3025, 'BRQ-3025', 'Honey Dresden Plate Handmade Quilt', 'Twin plush handmade quilt with bamboo fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 240.30, NULL, 96, NULL, '/uploads/products/3025/1779626391136-w7fbutrg.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:39:53'),
(3026, 'BRQ-3026', 'Amber Dresden Plate Handmade Quilt', '<p>Twin all-season handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.</p>', 400.37, '{\"large\": 430.37, \"small\": 400.37, \"x-large\": 460.37, \"xx-large\": 490.37, \"xxx-large\": 520.37}', 71, NULL, '/uploads/products/3026/1780178377264-imouc1l3.png', 1, 0, '2026-05-10 13:09:22', '2026-05-30 21:59:37'),
(3027, 'BRQ-3027', 'Cream Sunrise Patch Handmade Quilt', 'Twin medium loft handmade quilt with organic cotton fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 334.90, NULL, 37, NULL, '/uploads/products/3027/1779625954317-qencguip.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:32:37'),
(3028, 'BRQ-3028', 'Cream Garden Path Handmade Quilt', 'Twin plush handmade quilt with cotton fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 427.55, NULL, 48, NULL, '/uploads/products/3028/1779625813721-8trh8n9c.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:30:15'),
(3029, 'BRQ-3029', 'Stone Artisan Diamond Handmade Quilt', 'Full/Queen medium loft handmade quilt with organic cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 105.60, NULL, 78, NULL, '/uploads/products/3029/1779626318266-i8zfl59i.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:38:40'),
(3030, 'BRQ-3030', 'Copper Prairie Weave Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 392.87, NULL, 83, NULL, '/uploads/products/3030/1779625746970-dxfbny8s.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:29:09'),
(3031, 'BRQ-3031', 'Oatmeal Summit Cross Handmade Quilt', 'King lightweight handmade quilt with cotton fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 365.99, NULL, 65, NULL, '/uploads/products/3031/1779627002800-d2vywtus.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:50:05'),
(3032, 'BRQ-3032', 'Rosewood Midnight Star Handmade Quilt', 'Full/Queen plush handmade quilt with organic cotton fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 184.72, NULL, 34, NULL, '/uploads/products/3032/1779627119031-ov13e48n.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:52:01'),
(3033, 'BRQ-3033', 'Indigo Hand-Stitched Bloom Handmade Quilt', 'King medium loft handmade quilt with organic cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 258.25, NULL, 77, NULL, '/uploads/products/3033/1779626438560-aql5ufn8.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:40:40'),
(3034, 'BRQ-3034', 'Sage Autumn Leaf Handmade Quilt', 'Throw lightweight handmade quilt with wool blend fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 213.79, NULL, 42, NULL, '/uploads/products/3034/1779626896327-qb1848d4.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:48:24'),
(3035, 'BRQ-3035', 'Rosewood Linen Field Handmade Quilt', 'Full/Queen lightweight handmade quilt with cotton fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 348.61, NULL, 61, NULL, '/uploads/products/3035/1779627177691-lrypipvq.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:53:01'),
(3036, 'BRQ-3036', 'Sand Prairie Weave Handmade Quilt', 'Throw lightweight handmade quilt with microfiber fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 103.26, NULL, 31, NULL, '/uploads/products/3036/1779626645500-chmpvrsf.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:44:08'),
(3037, 'BRQ-3037', 'Indigo Rail Fence Handmade Quilt', 'Twin all-season handmade quilt with organic cotton fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 287.27, NULL, 74, NULL, '/uploads/products/3037/1779626462506-08dpzdz5.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:41:05'),
(3038, 'BRQ-3038', 'Mist Wholecloth Echo Handmade Quilt', 'Throw plush handmade quilt with cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 208.31, NULL, 73, NULL, '/uploads/products/3038/1779626835946-zfl8mlhp.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:47:18'),
(3039, 'BRQ-3039', 'Ivory Midnight Star Handmade Quilt', 'Throw medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 334.28, NULL, 67, NULL, '/uploads/products/3039/1779626548166-gxwyp0vp.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:42:30'),
(3040, 'BRQ-3040', 'Oatmeal Cottage Stripe Handmade Quilt', 'King plush handmade quilt with cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 185.52, NULL, 67, NULL, '/uploads/products/3040/1779626924028-xpshrqbv.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:48:46'),
(3041, 'BRQ-3041', 'Ivory Riverstone Handmade Quilt', 'Throw medium loft handmade quilt with organic cotton fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 265.60, NULL, 85, NULL, '/uploads/products/3041/1779626676091-zf1o7wsl.jpg', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:44:38'),
(3042, 'BRQ-3042', 'Rosewood Velvet Horizon Handmade Quilt', 'Twin lightweight handmade quilt with organic cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 327.34, NULL, 62, NULL, '/uploads/products/3042/1779627093751-zft7rwc0.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:51:35'),
(3043, 'BRQ-3043', 'Ivory Autumn Leaf Handmade Quilt', 'Throw lightweight handmade quilt with bamboo fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 427.15, NULL, 62, NULL, '/uploads/products/3043/1779626527126-i2jafvhg.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:42:10'),
(3044, 'BRQ-3044', 'Terracotta Winterberry Handmade Quilt', 'Throw plush handmade quilt with microfiber fill and channel stitching. Pieced and finished in small batches for Bear River Quilting.', 228.83, NULL, 64, NULL, '/uploads/products/3044/1779625793968-y99v88ad.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:29:57'),
(3045, 'BRQ-3045', 'Pearl Flying Geese Handmade Quilt', 'Throw medium loft handmade quilt with cotton fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 364.78, NULL, 10, NULL, '/uploads/products/3045/1779627147926-s96gxz3d.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:52:31'),
(3046, 'BRQ-3046', 'Fig Dresden Plate Handmade Quilt', 'King all-season handmade quilt with cotton fill and scalloped border. Pieced and finished in small batches for Bear River Quilting.', 254.92, NULL, 22, NULL, '/uploads/products/3046/1779626111442-afwl9y4f.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:35:14'),
(3047, 'BRQ-3047', 'Dusk Hand-Stitched Bloom Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and cross-hatch quilting. Pieced and finished in small batches for Bear River Quilting.', 220.79, NULL, 95, NULL, '/uploads/products/3047/1779626039641-l4btfsab.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:34:02'),
(3048, 'BRQ-3048', 'Terracotta Summit Cross Handmade Quilt', 'Throw plush handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 441.39, NULL, 99, NULL, '/uploads/products/3048/1779626158426-tsttjhm4.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 12:35:59'),
(3049, 'BRQ-3049', 'Cream Rail Fence Handmade Quilt', 'Full/Queen medium loft handmade quilt with bamboo fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 418.75, NULL, 28, 'x-large', '/uploads/products/3049/1779625871502-z4i6oeef.webp', 1, 1, '2026-05-10 13:09:22', '2026-05-26 04:35:33'),
(3050, 'BRQ-3050', 'Stone Log Cabin Handmade Quilt', 'Throw medium loft handmade quilt with wool blend fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 91.01, NULL, 49, NULL, '/uploads/products/3050/1779619403462-w01qnl0l.webp', 1, 0, '2026-05-10 13:09:22', '2026-05-24 10:43:27'),
(3051, 'BRQ-3051', 'Autumn Breeze Warmth Quilt', '<p>Wrap yourself in comfort with the Autumn Breeze Warmth Quilt, designed to bring the cozy feeling of crisp fall days into your home. Featuring soft, breathable fabrics and a timeless design inspired by the colors of autumn, this quilt provides the perfect balance of warmth and lightweight comfort. Whether layered on your bed or draped over your favorite chair, it adds a touch of seasonal charm and inviting elegance to any space.</p>', 120.00, '{\"large\": 140, \"small\": 120, \"x-large\": 155, \"xx-large\": 170, \"xxx-large\": 195}', 90, 'large', '/uploads/products/3051/1780193491661-ttvdplcm.png', 1, 0, '2026-05-31 02:09:23', '2026-05-31 02:11:57'),
(3052, 'BRQ-3052', 'Wintergreen Forest Warmth Quilt', '<p>Bring the serene beauty of an evergreen forest into your bedroom with the Wintergreen Forest Warmth Quilt. Crafted for exceptional comfort, this quilt combines soft textures with reliable warmth, creating a cozy retreat during cooler seasons. Inspired by the rich greens and peaceful atmosphere of winter woodlands, its classic design adds a natural, refreshing touch to any décor while providing the comfort you need for restful nights.</p>', 130.00, '{\"large\": 145, \"small\": 130, \"x-large\": 155, \"xx-large\": 166, \"xxx-large\": 190}', 76, 'large', '/uploads/products/3052/1780194348688-q361dq1d.png', 1, 0, '2026-05-31 02:23:21', '2026-05-31 02:25:48'),
(3054, NULL, 'Oatmeal Modern Heirloom Handmade Quilt - test', 'Full/Queen medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.', 180.98, NULL, 70, NULL, '/uploads/products/3001/1779626968531-i6bqdx7l.webp', 1, 0, '2026-06-01 04:03:52', '2026-06-01 04:03:52'),
(3055, NULL, 'Spruce Bargello Waves Handmade Quilt - - test', 'Twin all-season handmade quilt with microfiber fill and minimal grid quilting. Pieced and finished in small batches for Bear River Quilting.', 184.11, NULL, 49, NULL, '/uploads/products/3002/1779626576226-zqdsy5do.webp', 1, 0, '2026-06-01 04:03:52', '2026-06-01 04:03:52'),
(3056, NULL, 'Rosewood Willow Stitch Handmade Quilt -- - test', 'Full/Queen plush handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 291.02, NULL, 29, NULL, '/uploads/products/3003/1779627034129-sxo89984.webp', 1, 0, '2026-06-01 04:03:52', '2026-06-01 04:03:52'),
(3057, NULL, 'Amber Patchwork Star Handmade Quilt -- - test', '<p>Full/Queen medium loft handmade quilt with microfiber fill and hand-bound edges. Pieced and finished in small batches for Bear River Quilting.</p>', 348.30, NULL, 78, NULL, '/uploads/products/3004/1780182657199-37v04aok.png', 1, 1, '2026-06-01 04:03:52', '2026-06-01 04:03:52'),
(3058, NULL, 'Fig Soft Loom Handmade Quilt -- - test', 'King medium loft handmade quilt with bamboo fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 237.68, NULL, 73, NULL, '/uploads/products/3005/1779626139618-bbd4sf8w.webp', 1, 0, '2026-06-01 04:03:53', '2026-06-01 04:03:53');

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `id` int UNSIGNED NOT NULL,
  `slug` varchar(191) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_categories`
--

INSERT INTO `product_categories` (`id`, `slug`, `name`, `description`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'handmade-quilts', 'Handmade Quilts', 'Handmade Quilts for sale', 0, '2026-05-26 15:34:44', '2026-05-26 15:34:44'),
(2, 'machine-sewed', 'Machine Sewed ', 'Machine Sewed quilts', 0, '2026-05-26 15:34:59', '2026-05-26 15:34:59'),
(3, 'log-cabin-quilts', 'Log Cabin Quilts', 'Log Cabin Quilts', 0, '2026-05-26 18:20:29', '2026-05-26 18:20:29'),
(4, 'nine-patch-quilts', 'Nine Patch Quilts', 'Nine Patch Quilts', 0, '2026-05-26 18:20:38', '2026-05-26 18:20:38'),
(5, 'flying-geese-quilts', 'Flying Geese Quilts', 'Flying Geese Quilts', 0, '2026-05-26 18:20:42', '2026-05-26 18:20:42'),
(7, 'hexagon-quilts', 'Hexagon Quilts', 'Hexagon Quilts', 0, '2026-05-26 18:21:01', '2026-05-26 18:21:01'),
(8, 'bargello-quilts', 'Bargello Quilts', 'Bargello Quilts', 0, '2026-05-26 18:21:07', '2026-05-26 18:21:07'),
(9, 'crazy-quilts', 'Crazy Quilts', 'Crazy Quilts', 0, '2026-05-26 18:21:15', '2026-05-26 18:21:15'),
(10, 'hand-quilted', 'Hand-Quilted', 'Hand-Quilted', 0, '2026-05-26 18:21:19', '2026-05-26 18:21:19'),
(12, 'english-paper-pieced-epp', 'English Paper Pieced (EPP)', 'English Paper Pieced (EPP)', 0, '2026-05-26 18:22:07', '2026-05-26 18:22:07'),
(13, 'trapunto-quilts', 'Trapunto Quilts', 'Trapunto Quilts', 0, '2026-05-26 18:22:15', '2026-05-26 18:22:15'),
(14, 'amish-quilts', 'Amish Quilts', 'Amish Quilts', 0, '2026-05-26 18:22:21', '2026-05-26 18:22:21'),
(15, 'hawaiian-quilts', 'Hawaiian Quilts', 'Hawaiian Quilts', 0, '2026-05-26 18:22:26', '2026-05-26 18:22:26');

-- --------------------------------------------------------

--
-- Table structure for table `product_category_products`
--

CREATE TABLE `product_category_products` (
  `category_id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `product_category_products`
--

INSERT INTO `product_category_products` (`category_id`, `product_id`, `sort_order`) VALUES
(1, 3042, 1),
(1, 3026, 2),
(1, 3052, 3),
(2, 3019, 0),
(2, 3040, 1),
(2, 3026, 2),
(10, 3051, 0),
(14, 3007, 0),
(14, 3051, 2);

-- --------------------------------------------------------

--
-- Table structure for table `product_email_blasts`
--

CREATE TABLE `product_email_blasts` (
  `id` int UNSIGNED NOT NULL,
  `product_id` int UNSIGNED NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personal_message` text COLLATE utf8mb4_unicode_ci,
  `recipient_count` int UNSIGNED NOT NULL DEFAULT '0',
  `sent_count` int UNSIGNED NOT NULL DEFAULT '0',
  `failed_count` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_email_blasts`
--

INSERT INTO `product_email_blasts` (`id`, `product_id`, `subject`, `personal_message`, `recipient_count`, `sent_count`, `failed_count`, `created_at`) VALUES
(1, 3026, 'Amber Dresden Plate Handmade Quilt', 'Twin all-season handmade quilt with microfiber fill and echo quilting. Pieced and finished in small batches for Bear River Quilting.', 7, 7, 0, '2026-06-01 20:33:54'),
(2, 3007, 'Amber Artisan Diamond Handmade Quilt — Bear River Quilting', NULL, 1, 1, 0, '2026-06-01 20:38:20'),
(3, 3007, 'Amber Artisan Diamond Handmade Quilt — Bear River Quilting', NULL, 1, 1, 0, '2026-06-01 20:39:55'),
(4, 3051, 'Autumn Breeze Warmth Quilt — Bear River Quilting', NULL, 1, 1, 0, '2026-06-01 21:08:23');

-- --------------------------------------------------------

--
-- Table structure for table `product_email_blast_recipients`
--

CREATE TABLE `product_email_blast_recipients` (
  `id` int UNSIGNED NOT NULL,
  `blast_id` int UNSIGNED NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('sent','failed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_email_blast_recipients`
--

INSERT INTO `product_email_blast_recipients` (`id`, `blast_id`, `email`, `status`, `error_message`, `sent_at`) VALUES
(1, 1, 'shaj.k.miah@gmail.com', 'sent', NULL, '2026-06-01 20:33:54'),
(2, 1, 'fastguy199@gmail.com', 'sent', NULL, '2026-06-01 20:33:55'),
(3, 1, 'samanthaalto@hotmail.com', 'sent', NULL, '2026-06-01 20:33:55'),
(4, 1, 'jamilakabir975@gmail.com', 'sent', NULL, '2026-06-01 20:33:55'),
(5, 1, 'tracyalto@brqllc.com', 'sent', NULL, '2026-06-01 20:33:55'),
(6, 1, 'joelachankeng@gmail.com', 'sent', NULL, '2026-06-01 20:33:55'),
(7, 1, 'godwin.y15@gmail.com', 'sent', NULL, '2026-06-01 20:33:55'),
(8, 2, 'pream0526@gmail.com', 'sent', NULL, '2026-06-01 20:38:20'),
(9, 3, 'shaj.k.miah@gmail.com', 'sent', NULL, '2026-06-01 20:39:56'),
(10, 4, 'mokoti1015@gmail.com', 'sent', NULL, '2026-06-01 21:08:23');

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
(59, 3021, '/uploads/products/3021/1779625563611-0y13x4fk.jpg', 0, '2026-05-24 12:26:04'),
(63, 3018, '/uploads/products/3018/1779625701101-ovzhcg42.webp', 0, '2026-05-24 12:28:21'),
(64, 3019, '/uploads/products/3019/1779625725031-9ulratrt.webp', 0, '2026-05-24 12:28:45'),
(65, 3030, '/uploads/products/3030/1779625746970-dxfbny8s.webp', 0, '2026-05-24 12:29:07'),
(66, 3014, '/uploads/products/3014/1779625765250-0pcqoohu.webp', 0, '2026-05-24 12:29:26'),
(67, 3044, '/uploads/products/3044/1779625793968-y99v88ad.webp', 0, '2026-05-24 12:29:54'),
(68, 3028, '/uploads/products/3028/1779625813721-8trh8n9c.webp', 0, '2026-05-24 12:30:14'),
(70, 3049, '/uploads/products/3049/1779625871502-z4i6oeef.webp', 0, '2026-05-24 12:31:12'),
(71, 3011, '/uploads/products/3011/1779625896227-4rhye8jm.webp', 0, '2026-05-24 12:31:36'),
(72, 3027, '/uploads/products/3027/1779625954317-qencguip.webp', 0, '2026-05-24 12:32:34'),
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
(109, 3006, '/uploads/products/3006/1779627260441-w8krqrcj.webp', 0, '2026-05-24 12:54:20'),
(110, 3044, '/uploads/products/3044/1779774004264-9y33l7ds.webp', 1, '2026-05-26 05:40:06'),
(111, 3044, '/uploads/products/3044/1779774004772-7jsezkst.webp', 2, '2026-05-26 05:40:06'),
(112, 3044, '/uploads/products/3044/1779774005506-y75yj2j4.webp', 3, '2026-05-26 05:40:06'),
(113, 3044, '/uploads/products/3044/1779774005847-z365gmti.webp', 4, '2026-05-26 05:40:06'),
(114, 3046, '/uploads/products/3046/1779807276926-090zhzfm.webp', 1, '2026-05-26 14:54:42'),
(115, 3046, '/uploads/products/3046/1779807277360-v4bez544.webp', 2, '2026-05-26 14:54:42'),
(116, 3046, '/uploads/products/3046/1779807278030-qz3lynck.jpg', 3, '2026-05-26 14:54:42'),
(117, 3046, '/uploads/products/3046/1779807280116-za4fakub.webp', 4, '2026-05-26 14:54:42'),
(118, 3046, '/uploads/products/3046/1779807281745-abvp74jl.webp', 5, '2026-05-26 14:54:42'),
(119, 3042, '/uploads/products/3042/1779815900267-h8kgjes9.webp', 1, '2026-05-26 17:18:22'),
(120, 3042, '/uploads/products/3042/1779815900525-ri66it0g.webp', 2, '2026-05-26 17:18:22'),
(121, 3042, '/uploads/products/3042/1779815901560-ltcz0d71.webp', 3, '2026-05-26 17:18:23'),
(122, 3042, '/uploads/products/3042/1779815901795-beqmeami.webp', 4, '2026-05-26 17:18:23'),
(123, 3042, '/uploads/products/3042/1779815901939-jofu751b.webp', 5, '2026-05-26 17:18:23'),
(124, 3042, '/uploads/products/3042/1779815902681-9959ov4j.webp', 6, '2026-05-26 17:18:23'),
(125, 3028, '/uploads/products/3028/1779853418401-21cm1ss4.webp', 1, '2026-05-27 03:43:38'),
(126, 3028, '/uploads/products/3028/1779853418485-67vpzihm.webp', 2, '2026-05-27 03:43:38'),
(127, 3049, '/uploads/products/3049/1779855053583-7emj7g95.jpg', 1, '2026-05-27 04:10:53'),
(128, 3049, '/uploads/products/3049/1779855053658-gs1jmyxy.jpg', 2, '2026-05-27 04:10:53'),
(129, 3007, '/uploads/products/3007/1780156279008-ueoabzmm.png', 1, '2026-05-30 15:51:19'),
(133, 3026, '/uploads/products/3026/1780178377264-imouc1l3.png', 0, '2026-05-30 21:59:37'),
(135, 3021, '/uploads/products/3021/1780182602309-h03gshzz.png', 1, '2026-05-30 23:10:02'),
(136, 3004, '/uploads/products/3004/1780182657199-37v04aok.png', 0, '2026-05-30 23:10:57'),
(137, 3013, '/uploads/products/3013/1780185739823-cphnkfm2.png', 1, '2026-05-31 00:02:19'),
(138, 3051, '/uploads/products/3051/1780193491661-ttvdplcm.png', 0, '2026-05-31 02:11:31'),
(139, 3052, '/uploads/products/3052/1780194348688-q361dq1d.png', 0, '2026-05-31 02:25:48'),
(140, 3052, '/uploads/products/3052/1780194349929-kdj2kwvm.png', 1, '2026-05-31 02:26:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customize_wizard_config`
--
ALTER TABLE `customize_wizard_config`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `media_assets`
--
ALTER TABLE `media_assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_media_path` (`path`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`);

--
-- Indexes for table `order_custom_payments`
--
ALTER TABLE `order_custom_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_number` (`payment_number`),
  ADD KEY `idx_ocp_order` (`order_id`),
  ADD KEY `idx_ocp_email` (`customer_email`),
  ADD KEY `idx_ocp_status` (`status`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_items_order` (`order_id`),
  ADD KEY `fk_order_items_product` (`product_id`);

--
-- Indexes for table `order_messages`
--
ALTER TABLE `order_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_messages_order` (`order_id`,`created_at`);

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
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `product_category_products`
--
ALTER TABLE `product_category_products`
  ADD PRIMARY KEY (`category_id`,`product_id`),
  ADD KEY `fk_pcp_product` (`product_id`),
  ADD KEY `idx_pcp_category_sort` (`category_id`,`sort_order`);

--
-- Indexes for table `product_email_blasts`
--
ALTER TABLE `product_email_blasts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_email_blasts_product` (`product_id`),
  ADD KEY `idx_product_email_blasts_created` (`created_at`);

--
-- Indexes for table `product_email_blast_recipients`
--
ALTER TABLE `product_email_blast_recipients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_blast_recipients_blast` (`blast_id`),
  ADD KEY `idx_blast_recipients_email` (`email`);

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
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `media_assets`
--
ALTER TABLE `media_assets`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=203;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `order_custom_payments`
--
ALTER TABLE `order_custom_payments`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `order_messages`
--
ALTER TABLE `order_messages`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3059;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `product_email_blasts`
--
ALTER TABLE `product_email_blasts`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `product_email_blast_recipients`
--
ALTER TABLE `product_email_blast_recipients`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=141;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `order_custom_payments`
--
ALTER TABLE `order_custom_payments`
  ADD CONSTRAINT `fk_ocp_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `product_category_products`
--
ALTER TABLE `product_category_products`
  ADD CONSTRAINT `fk_pcp_category` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pcp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_email_blast_recipients`
--
ALTER TABLE `product_email_blast_recipients`
  ADD CONSTRAINT `fk_blast_recipients_blast` FOREIGN KEY (`blast_id`) REFERENCES `product_email_blasts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_pi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
