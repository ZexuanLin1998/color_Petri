#include"ads.h"
#include<iostream>
#include<thread>
#include<chrono>

bool myads::Ads::readdata(unsigned long indexoffset, bool &value)
{
	//char Place[10] = "p";
	//char* num = new char[3];
	//itoa(20, num, 10);
	//strcat(Place, num);
	//std::cout << Place << std::endl;
	//unsigned long lHdlVar;
	//char      szVar[] = { "MAIN.h48" };
	//得到句柄
	//nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar),
	//	&lHdlVar, sizeof(Place), Place);
	//nErr = AdsSyncReadReq(pAddr, 0x4020, indexoffset, sizeof(value), &value);
	//delete[] num;
	return true;
}
bool myads::Ads::readdata(unsigned long indexoffset, float& value)
{
	//char Place[10] = "p";
	//char* num = new char[3];
	//itoa(20, num, 10);
	//strcat(Place, num);
	//std::cout << Place << std::endl;
	//nErr = AdsSyncReadReq(pAddr, 0x4020, indexoffset, sizeof(value), &value);
	//delete[] num;
	return true;
}

bool myads::Ads::writeval(int n, unsigned long indexoffset)
{
	//char Place[10] = "p";
	//char* num = new char[3];
	//itoa(20, num, 10);
	//strcat(Place, num);
	//std::cout << Place << std::endl;
	//unsigned long lHdlVar=0;
	//bool enabl = true;
	//char      szVar[] = { "MAIN.h48" };
	//p1 = !p1;
	//写入值
	//nErr = AdsSyncWriteReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar, 1, &enabl);
	//nErr = AdsSyncWriteReq(pAddr, ADSIGRP_SYM_RELEASEHND, 0, sizeof(lHdlVar), &lHdlVar);
	//nErr = AdsSyncWriteReq(pAddr, 0x4020, indexoffset, sizeof(int), &n);
	//nErr = AdsSyncWriteReq(pAddr, 0x4020, 0, sizeof(lHdlVar), &lHdlVar);
	//delete[] num;
	return true;
}
bool myads::Ads::writeval()
{
	//bool enabl = true;
	//nErr = AdsSyncWriteReq(pAddr, 0x4020, indexoffset, sizeof(bool), &n);
	return true;
}


