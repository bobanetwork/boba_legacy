ALTER USER 'admin'@'%' IDENTIFIED WITH mysql_native_password BY 'password';

CREATE DATABASE IF NOT EXISTS `boba_xv1`;
CREATE DATABASE IF NOT EXISTS `boba_tx`;
CREATE DATABASE IF NOT EXISTS `boba_receipts`;
GRANT ALL ON `boba_xv1`.* TO 'admin'@'%';
GRANT ALL ON `boba_tx`.* TO 'admin'@'%';
GRANT ALL ON `boba_receipts`.* TO 'admin'@'%';
