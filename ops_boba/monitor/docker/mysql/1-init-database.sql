ALTER USER 'admin'@'%' IDENTIFIED WITH mysql_native_password BY 'password';

CREATE DATABASE IF NOT EXISTS `omg_xv1`;
CREATE DATABASE IF NOT EXISTS `omg_tx`;
CREATE DATABASE IF NOT EXISTS `omg_receipts`;
GRANT ALL ON `omg_xv1`.* TO 'admin'@'%';
GRANT ALL ON `omg_tx`.* TO 'admin'@'%';
GRANT ALL ON `omg_receipts`.* TO 'admin'@'%';
