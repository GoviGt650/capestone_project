#!/usr/bin/env python3
"""MySQL to MySQL RDS Migration Script"""

import os
import sys
import subprocess
import logging
import datetime
from pathlib import Path

PRIMARY_DB = {
    'host': 'users-db.c1wo0oqs2zrs.eu-north-1.rds.amazonaws.com',
    'port': '3306',
    'name': 'users_db',
    'user': 'govi',
    'password': 'admin123',
}

SECONDARY_DB = {
    'host': 'users-db-backup.c1wo0oqs2zrs.eu-north-1.rds.amazonaws.com',
    'port': '3306',
    'name': 'users_db',
    'user': 'govi',
    'password': 'admin123',
}

log_dir = Path('/var/log/db-migration')
log_dir.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / f'migration_{datetime.date.today()}.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class MySQLMigrator:
    def __init__(self):
        self.timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        self.backup_dir = Path('/tmp/db_backups')
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.dump_file = self.backup_dir / f'mysql_dump_{self.timestamp}.sql'
        
    def test_connection(self, db_config, name="Database"):
        try:
            cmd = ['mysql', '-h', db_config['host'], '-P', str(db_config['port']),
                   '-u', db_config['user'], f"-p{db_config['password']}", '-e', 'SELECT 1;']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                logger.info(f"✅ {name} connection successful: {db_config['host']}")
                return True
            else:
                logger.error(f"❌ {name} connection failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ {name} connection error: {str(e)}")
            return False
    
    def create_database_if_not_exists(self, db_config):
        try:
            cmd = ['mysql', '-h', db_config['host'], '-P', str(db_config['port']),
                   '-u', db_config['user'], f"-p{db_config['password']}",
                   '-e', f"CREATE DATABASE IF NOT EXISTS {db_config['name']};"]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                logger.info(f"✅ Database '{db_config['name']}' ready on {db_config['host']}")
                return True
            else:
                logger.error(f"❌ Create DB failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ Create DB error: {str(e)}")
            return False
    
    def dump_database(self):
        logger.info(f"📦 Dumping Primary DB: {PRIMARY_DB['host']}")
        try:
            cmd = ['mysqldump', '-h', PRIMARY_DB['host'], '-P', str(PRIMARY_DB['port']),
                   '-u', PRIMARY_DB['user'], f"-p{PRIMARY_DB['password']}",
                   '--skip-lock-tables', '--no-tablespaces', '--column-statistics=0',
                   '--set-gtid-purged=OFF', '--routines', '--triggers', '--events',
                   PRIMARY_DB['name']]
            with open(self.dump_file, 'w') as f:
                result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True, timeout=3600)
            if result.returncode == 0:
                file_size = self.dump_file.stat().st_size
                logger.info(f"✅ Dump created: {self.dump_file} ({file_size/1024/1024:.2f} MB)")
                return True
            else:
                logger.error(f"❌ Dump failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ Dump error: {str(e)}")
            return False
    
    def restore_database(self):
        logger.info(f"🔄 Restoring to Secondary DB: {SECONDARY_DB['host']}")
        try:
            cmd = ['mysql', '-h', SECONDARY_DB['host'], '-P', str(SECONDARY_DB['port']),
                   '-u', SECONDARY_DB['user'], f"-p{SECONDARY_DB['password']}", SECONDARY_DB['name']]
            with open(self.dump_file, 'r') as f:
                result = subprocess.run(cmd, stdin=f, capture_output=True, text=True, timeout=3600)
            if result.returncode == 0:
                logger.info(f"✅ Restore completed to {SECONDARY_DB['host']}")
                return True
            else:
                logger.error(f"❌ Restore failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ Restore error: {str(e)}")
            return False
    
    def cleanup(self, keep_days=7):
        try:
            cutoff = datetime.datetime.now() - datetime.timedelta(days=keep_days)
            count = 0
            for file in self.backup_dir.glob('mysql_dump_*.sql'):
                if file.stat().st_mtime < cutoff.timestamp():
                    file.unlink()
                    count += 1
            if count > 0:
                logger.info(f"🧹 Cleaned {count} old backups")
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")
    
    def run(self):
        start = datetime.datetime.now()
        logger.info("=" * 60)
        logger.info(f"🚀 MySQL Migration: {self.timestamp}")
        logger.info(f"   Primary: {PRIMARY_DB['host']}")
        logger.info(f"   Secondary: {SECONDARY_DB['host']}")
        logger.info("=" * 60)
        
        if not self.test_connection(PRIMARY_DB, "Primary"): sys.exit(1)
        if not self.test_connection(SECONDARY_DB, "Secondary"): sys.exit(1)
        
        self.create_database_if_not_exists(SECONDARY_DB)
        
        if not self.dump_database(): sys.exit(1)
        if not self.restore_database(): sys.exit(1)
        self.cleanup()
        
        duration = (datetime.datetime.now() - start).total_seconds()
        logger.info(f"✅ Migration done in {duration:.2f}s")
        logger.info("=" * 60)

if __name__ == '__main__':
    MySQLMigrator().run()
