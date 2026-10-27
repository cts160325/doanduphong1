@echo off
echo Dang sao luu (Backup) co so du lieu MongoDB...
mongodump --db=QLRauCu --out=./backup/
echo Sao luu thanh cong vao thu muc ./backup/
pause
