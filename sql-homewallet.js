module.exports = function(post, password) {
return "\n CREATE DATABASE  `storewizard_"+post.login+"`;"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store` ("+
	"\n `id` tinyint(4) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `order` int(11) NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `key` (`key`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO  `storewizard_"+post.login+"`.`store` (`id`, `key`, `name`, `order`) VALUES"+
	"\n (null, 'members', 'Пользователи', 1),"+
	"\n (null, 'operation', 'Операции', 2),"+
	"\n (null, 'category', 'Категории', 3),"+
	"\n (null, 'subcategory', 'Подкатегории', 4),"+
	"\n (null, 'account', 'Счета', 5),"+				
	"\n (null, 'contact', 'Контакты', 6),"+
	"\n (null, 'losses', 'Расход', 7),"+
	"\n (null, 'profit', 'Доход', 8);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_account` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `remark` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `ballance` int(11) NOT NULL,"+
	"\n PRIMARY KEY (`id`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_account` (`id`, `name`, `remark`, `ballance`) VALUES"+
	"\n (null, 'Домашний кошелек', 'Общий кошелек, наличные', 0);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_account_fields` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `typeId` tinyint(4) NOT NULL,"+
	"\n `order` tinyint(4) NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `key` (`key`),"+
	"\n KEY `type_id` (`typeId`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+	

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_account_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'name', 1, 1, 'Тип счета', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'remark', 2, 2, 'Примечание', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'ballance', 7, 3, 'Баланс', 'operation', 'sum', 'account', 'summ', '', 'Да', 1),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 1);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_category` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `name` varchar(150) CHARACTER SET cp1251 NOT NULL,"+
	"\n `remark` text CHARACTER SET cp1251 NOT NULL,"+
	"\n `type` enum('Доход','Расход') COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `subcategory`enum('Доход','Расход') COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;"+

	"\n INSERT INTO  `storewizard_"+post.login+"`.`store_category` (`id`, `name`, `remark`, `type`, `subcategory`) VALUES"+
	"\n (2, 'Автомобиль', 'Категория затрат на автомобиль', 'Расход', 5),"+
	"\n (7, 'Дорога', 'Общественный транспорт, метро, автобусы, трамваи, такси', 'Расход', 1),"+
	"\n (8, 'Алименты', '', 'Расход', 1),"+
	"\n (10, 'Больница', 'Категория затрат на больницу и лечение', 'Расход', 4),"+
	"\n (14, 'Развлечение', 'Категория развлечений', 'Расход', 6),"+
	"\n (18, 'Кредиты', 'Категория кредитов', 'Расход', 4),"+
	"\n (23, 'Продукты', 'Затраты на приобретение продуктов', 'Расход', 1),"+
	"\n (24, 'Обед', '', 'Расход', 1),"+
	"\n (25, 'Одежда', '', 'Расход', 1),"+
	"\n (27, 'Ребенок', '', 'Расход', 7),"+
	"\n (35, 'Косметика', '', 'Расход', 2),"+
	"\n (39, 'Для дома', '', 'Расход', 4),"+
	"\n (43, 'Сотик', '', 'Расход', 1),"+
	"\n (45, 'Кв. плата', '', 'Расход', 4),"+
	"\n (51, 'Прочее', '', 'Расход', 1),"+
	"\n (52, 'Зарплата', '', 'Доход', 0);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_category_fields` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `typeId` tinyint(4) NOT NULL,"+
	"\n `order` tinyint(4) NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `key` (`key`),"+
	"\n KEY `type_id` (`typeId`)"+
	" ) ENGINE=MyISAM  DEFAULT CHARSET=utf8; "+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_category_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'name', 1, 1, 'Имя', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'remark', 2, 2, 'Описание', NULL, NULL, NULL, '', '', '', 1),"+
	"\n (null, 'subcategory', 7, 5, 'Кол-во под категорий', 'subcategory', 'id', 'category', 'count', '', 'Да', 1),"+
	"\n (null, 'type', 5, 4, 'Тип', NULL, '''Доход'',''Расход''', NULL, '', '', 'Да', 1),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 1);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_contact` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `name` varchar(150) NOT NULL,"+
	"\n `phone` varchar(150) NOT NULL,"+
	"\n `address` text NOT NULL,"+
	"\n `email` varchar(150) NOT NULL,"+
	"\n `birthday` datetime NOT NULL,"+
	"\n `comments` text NOT NULL,"+
	"\n PRIMARY KEY (`id`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_contact_fields` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `typeId` tinyint(4) NOT NULL,"+
	"\n `order` tinyint(4) NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `attr` varchar(150) NOT NULL,"+
	"\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_contact_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'name', 1, 1, 'Имя', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'phone', 10, 2, 'Телефон', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'address', 2, 7, 'Адрес', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'email', 9, 9, 'E-mail', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'comments', 2, 11, 'Комментарии', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'birthday', 4, 6, 'День рождения', NULL, NULL, NULL, '', '', 'Нет', 0),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 1);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_fields` ("+
	"\n `id` tinyint(4) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(150) NOT NULL,"+
	"\n `value` varchar(150) NOT NULL,"+
	"\n `name` varchar(100) NOT NULL,"+
	"\n `remark` varchar(255) NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n UNIQUE KEY `id` (`id`),"+
	"\n KEY `type` (`name`),"+
	"\n KEY `key` (`key`)"+
	"\n) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_fields` (`id`, `key`, `value`, `name`, `remark`) VALUES"+
	"\n (1, 'char', 'varchar', 'Символы', 'Символы. Не более 255. Подходит для редактирование небольших по объему полей, таких как: название компании, телефон, контактное лицо и т.д.'),"+
	"\n (2, 'text', 'text', 'Текст', 'Поле подходит для больших массивов текстовой информации'),"+
	"\n (3, 'int', 'int', 'Числа', 'Только целые числа'),"+
	"\n (4, 'datetime', 'datetime', 'Дата и время', 'Формат даты и времени.'),"+
	"\n (5, 'select', 'enum', 'Перечисление', 'Этот тип подходит для организации перечислений. Например оплачен, не оплачен и т.д.'),"+
	"\n (7, 'link', 'int', 'Объект', 'Это тип есть ссылка на группы полей'),"+
	"\n (8, 'password', 'varchar', 'Пароль', 'Тип пароль. Данные скрываются'),"+
	"\n (9, 'email', 'varchar', 'Электронный адрес', 'Поле электронный адрес'),"+
	"\n (10, 'phone', 'varchar', 'Телефон', 'Поле телефон'),"+
	"\n (11, 'autocomplete', 'int', 'Автозаполнение', 'Тип объект - автозаполнение'),"+
	"\n (16, 'money', 'int', 'деньги', ''),"+
	"\n (6, 'multiselect', 'set', 'Множественный выбор', 'Выбор множества из множества'),"+
	"\n (17, 'htmleditor', 'text', '', '');"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_members` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `login` varchar(150) COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `password` blob NOT NULL,"+
	"\n `name` varchar(150) COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `role` enum('Администратор','Пользователь') COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `email` varchar(150) COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `activity` enum('Да','Нет') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Нет',"+
	"\n `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,"+
	"\n PRIMARY KEY (`id`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_members` (`id`, `login`, `password`, `name`, `role`, `email`, `activity`, `date`) VALUES"+
	"\n (null, '"+post.login+"', AES_ENCRYPT('"+password+"', 'Rktc4i!'), '"+post.name+"', 'Администратор', '"+post.email+"', 'Да', NOW());"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_members_fields` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `typeId` tinyint(4) NOT NULL,"+
	"\n `order` tinyint(4) NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `key` (`key`),"+
	"\n KEY `type_id` (`typeId`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_members_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'name', 1, 3, 'Имя', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'date', 4, 9, 'Дата регистрации', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'role', 5, 5, 'Роль', NULL, '''Администратор'',''Пользователь''', NULL, '', '', 'Да', 1),"+
	"\n (null, 'email', 9, 6, 'E-Mail', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'activity', 5, 7, 'Активен', NULL, '''Да'',''Нет''', NULL, '', '', 'Да', 1),"+
	"\n (null, 'login', 1, 1, 'Логин', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'password', 8, 2, 'Пароль', NULL, NULL, NULL, '', '', 'Да', 0),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 1);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_operation` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `account` int(11) NOT NULL,"+
	"\n `subcategory` int(11) NOT NULL,"+
	"\n `type` enum('Расход','Приход','Перевод') COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,"+
	"\n `sum` int(11) NOT NULL,"+
	"\n `member` int(11) NOT NULL,"+
	"\n `remark` text COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_operation_fields` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `typeId` tinyint(4) NOT NULL,"+
	"\n `order` tinyint(4) NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `attr` varchar(150) NOT NULL,"+
	"\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `key` (`key`),"+
	"\n KEY `type_id` (`typeId`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_operation_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'account', 7, 1, 'Счет', 'account', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'subcategory', 7, 2, 'Подкатегория', 'subcategory', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'type', 5, 3, 'Тип операции', NULL, '''Расход'',''Приход'',''Перевод''', NULL, '', '', 'Да', 1),"+
	"\n (null, 'date', 4, 4, 'Дата', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'remark', 2, 5, 'Примечание', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'sum', 16, 6, 'Сумма', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'member', 7, 7, 'Пользователь', 'members', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', 'readonly', 'Нет', 1);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_subcategory` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `name` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `remark` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `category` int(11) NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `categoryId` (`category`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_subcategory` (`id`, `name`, `remark`, `category`) VALUES"+
	"\n (3, 'Бензин', '', 2),"+
	"\n (4, 'Техническое обслуживание, ремонт', '', 2),"+
	"\n (5, 'Штрафы', '', 2),"+
	"\n (6, 'Мойка автомобиля', '', 2),"+
	"\n (7, 'Дорога', 'Общественный транспорт, метро, автобусы, трамваи и т.д', 7),"+
	"\n (8, 'Алименты', ' ', 8),"+
	"\n (9, 'Аптека', 'Затраты на лекарства', 10),"+
	"\n (11, 'Анализы', 'Затраты на анализы', 10),"+
	"\n (12, 'Врач', 'Затраты на посещения врачей', 10),"+
	"\n (13, 'Зубы', 'Затраты на посещения стомотологов', 10),"+
	"\n (14, 'Развлечение', 'Категория развлечений', 14),"+
	"\n (15, 'Спиртное', 'Приобретение спиртного', 14),"+
	"\n (16, 'Кафе', 'Посещение кафе, ресторанов', 14),"+
	"\n (17, 'Кино', ' ', 14),"+
	"\n (19, 'Кредит на комнату', ' ', 18),"+
	"\n (20, 'Кредит на квартиру', ' ', 18),"+
	"\n (23, 'Продукты', 'Затраты на приобретение продуктов', 23),"+
	"\n (24, 'Обед', ' ', 24),"+
	"\n (25, 'Одежда', ' ', 25),"+
	"\n (26, 'Подарок', ' ', 14),"+
	"\n (28, 'Пеленки ', ' ', 27),"+
	"\n (29, 'Детское питание', ' ', 27),"+
	"\n (30, 'Садик', ' ', 27),"+
	"\n (31, 'Детская одежда', ' ', 27),"+
	"\n (32, 'Игрушки', ' ', 27),"+
	"\n (33, 'Прочее на ребенка', ' ', 27),"+
	"\n (34, 'Няня', ' ', 27),"+
	"\n (36, 'Косметика', ' ', 35),"+
	"\n (37, 'Салон', ' ', 35),"+
	"\n (40, 'Хоз.товары', ' ', 39),"+
	"\n (41, 'Ремонт', ' ', 39),"+
	"\n (42, 'Товары для дома', ' ', 39),"+
	"\n (43, 'Сотик', ' ', 43),"+
	"\n (44, 'Канц.товары', ' ', 39),"+
	"\n (45, 'Аренда', ' ', 52),"+
	"\n (47, 'Кв. плата квартира', '  ', 45),"+
	"\n (48, 'Кв. плата телефон', ' ', 45),"+
	"\n (50, 'Кв. плата электроэнергия', ' ', 45),"+
	"\n (58, 'Родители мужа', ' ', 52),"+
	"\n (53, 'Мужа з/п', ' ', 52),"+
	"\n (54, 'Жены з/п', ' ', 52),"+
	"\n (57, 'Остаток', ' ', 52),"+
	"\n (59, 'Родители жены', ' ', 52),"+
	"\n (60, 'Халтура', ' ', 52),"+				
	"\n (62, 'Прочий доход', '    ', 52),"+
	"\n (63, 'Прочее', ' ', 51),"+
	"\n (66, 'Запчасти', '', 2);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_subcategory_fields` ("+
	"\n `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `typeId` tinyint(4) NOT NULL,"+
	"\n `order` tinyint(4) NOT NULL,"+
	"\n `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+			
	"\n `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n PRIMARY KEY (`id`),"+
	"\n KEY `key` (`key`),"+
	"\n KEY `type_id` (`typeId`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_subcategory_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'name', 1, 1, 'Наименование', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'remark', 2, 2, 'Примечание', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'category', 7, 4, 'Категория', 'category', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 1);"+			

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_losses` ("+
	"\n  `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n  `category` int(11) NOT NULL,"+
	"\n  `subcategory` int(11) NOT NULL,"+
	"\n  `year` year(4) NOT NULL,"+
	"\n  `january` int(11) NOT NULL,"+
	"\n  `february` int(11) NOT NULL,"+
	"\n  `march` int(11) NOT NULL,"+
	"\n  `april` int(11) NOT NULL,"+
	"\n  `may` int(11) NOT NULL,"+
	"\n  `june` int(11) NOT NULL,"+
	"\n  `july` int(11) NOT NULL,"+
	"\n  `august` int(11) NOT NULL,"+
	"\n  `september` int(11) NOT NULL,"+
	"\n  `october` int(11) NOT NULL,"+
	"\n  `november` int(11) NOT NULL,"+
	"\n  `december` int(11) NOT NULL,"+
	"\n  `average` int(11) NOT NULL,"+
	"\n  PRIMARY KEY (`id`),"+
	"\n  KEY `category` (`category`,`subcategory`)"+
	"\n) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_losses_fields` ("+
	"\n  `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n  `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `typeId` tinyint(4) NOT NULL,"+
	"\n  `order` tinyint(4) NOT NULL,"+
	"\n  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n  `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n  `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  PRIMARY KEY (`id`),"+
	"\n  KEY `key` (`key`),"+
	"\n  KEY `type_id` (`typeId`)"+
	"\n) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+

	"\n INSERT INTO `storewizard_"+post.login+"`.`store_losses_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'category', 7, 1, 'Категория', 'category', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'subcategory', 7, 2, 'Подкатегория', 'subcategory', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'january', 16, 3, 'Январь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'february', 16, 4, 'Февраль', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'march', 16, 5, 'Март', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'april', 16, 6, 'Апрель', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'may', 16, 7, 'Май', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'june', 16, 8, 'Июнь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'july', 16, 9, 'Июль', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'august', 16, 10, 'Август', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'september', 16, 11, 'Сентябрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'october', 16, 12, 'Октябрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'november', 16, 13, 'Ноябрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'december', 16, 14, 'Декабрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'average', 16, 15, 'Среднее', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'year', 1, 2, 'Год', NULL, NULL, NULL, '', '', 'Да', 1),"+
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 0);"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_profit` ("+
	"\n  `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n  `category` int(11) NOT NULL,"+
	"\n  `subcategory` int(11) NOT NULL,"+
	"\n  `year` year(4) NOT NULL,"+
	"\n  `january` int(11) NOT NULL,"+
	"\n  `february` int(11) NOT NULL,"+
	"\n  `march` int(11) NOT NULL,"+
	"\n  `april` int(11) NOT NULL,"+
	"\n  `may` int(11) NOT NULL,"+
	"\n  `june` int(11) NOT NULL,"+
	"\n  `july` int(11) NOT NULL,"+
	"\n  `august` int(11) NOT NULL,"+
	"\n  `september` int(11) NOT NULL,"+
	"\n  `october` int(11) NOT NULL,"+
	"\n  `november` int(11) NOT NULL,"+
	"\n  `december` int(11) NOT NULL,"+
	"\n  `average` int(11) NOT NULL,"+
	"\n  PRIMARY KEY (`id`),"+
	"\n  KEY `category` (`category`,`subcategory`)"+
	"\n) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;"+

	"\n CREATE TABLE IF NOT EXISTS `storewizard_"+post.login+"`.`store_profit_fields` ("+
	"\n  `id` int(11) NOT NULL AUTO_INCREMENT,"+
	"\n  `key` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `typeId` tinyint(4) NOT NULL,"+
	"\n  `order` tinyint(4) NOT NULL,"+
	"\n  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `link` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n  `value` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n  `anchor` varchar(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,"+
	"\n  `action` enum('','summ','last','count') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `attr` varchar(150) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `mandatory` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  `display` enum('Да','Нет') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,"+
	"\n  PRIMARY KEY (`id`),"+
	"\n  KEY `key` (`key`),"+
	"\n  KEY `type_id` (`typeId`)"+
	"\n ) ENGINE=MyISAM  DEFAULT CHARSET=utf8;"+
	
	"\n INSERT INTO `storewizard_"+post.login+"`.`store_profit_fields` (`id`, `key`, `typeId`, `order`, `name`, `link`, `value`, `anchor`, `action`, `attr`, `mandatory`, `display`) VALUES"+
	"\n (null, 'category', 7, 1, 'Категория', 'category', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'subcategory', 7, 2, 'Подкатегория', 'subcategory', 'name', 'id', 'last', '', 'Да', 1),"+
	"\n (null, 'january', 16, 3, 'Январь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'february', 16, 4, 'Февраль', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'march', 16, 5, 'Март', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'april', 16, 6, 'Апрель', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'may', 16, 7, 'Май', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'june', 16, 8, 'Июнь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'july', 16, 9, 'Июль', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'august', 16, 10, 'Август', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'september', 16, 11, 'Сентябрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'october', 16, 12, 'Октябрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'november', 16, 13, 'Ноябрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'december', 16, 14, 'Декабрь', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'average', 16, 15, 'Среднее', NULL, NULL, NULL, '', '', 'Нет', 1),"+
	"\n (null, 'year', 1, 2, 'Год', NULL, NULL, NULL, '', '', 'Да', 1),"+	
	"\n (null, 'id', 3, 0, 'id', NULL, NULL, NULL, '', '', 'Нет', 1);	"
}
	
