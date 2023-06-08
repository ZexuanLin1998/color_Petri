#pragma once
#include<bitset>
typedef unsigned long       DWORD;
typedef int                 BOOL;
typedef unsigned short      WORD;

#ifndef NULL
#ifdef __cplusplus
#define NULL    0
#else
#define NULL    ((void *)0)
#endif
#endif
#include<stdio.h>
#include<conio.h>
#include<Windows.h>
#include<vector>
#include<string.h>
#include<iostream>
#include"C:\TwinCAT\AdsApi\TcAdsDll\Include\TcAdsDef.h"
#include"C:\TwinCAT\AdsApi\TcAdsDll\Include\TcAdsAPI.h"

namespace myads {
	const int size_of_array = 27;

	using std::vector;
	class Ads
	{
	public:
		long nErr;
		long nPort;
		AmsAddr Addr;
		PAmsAddr pAddr;

		short place[27];

		//std::bitset<27>

		Ads()
		{
			//����·�ɣ���ȡNetID������PLC�˿ں�(����TWINCAT��Ϣ·��������)
			pAddr = &Addr;
			nPort = AdsPortOpen();

			//����ADSͨѶȷ��AMSNetId�����ر���NetId�Ͷ˿ںţ�
			nErr = AdsGetLocalAddress(pAddr);

			//Զ��Adsʹ������ע�͵Ĳ���ȷ��AMSNETID  ����Ǳ�����Router->Change AMS NetId�в鿴���ж����и���
			pAddr->netId.b[0] = 172;
			pAddr->netId.b[1] = 18;
			pAddr->netId.b[2] = 212;
			pAddr->netId.b[3] = 112;
			pAddr->netId.b[4] = 1;
			pAddr->netId.b[5] = 1;

			//ȷ���˿ں�
			pAddr->port = 851;
		}
		template <class T>
		void read_value(vector<T>& mem)
		{
			unsigned long lHdlVar2;
			int nIndex;
			short Array[size_of_array];
			char szVar2[] = { "MAIN.Array1" };

			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, sizeof(szVar2), szVar2);
			if (nErr) std::cerr << "Error: AdsSyncReadWriteReq: " << nErr << '\n';
			nErr = AdsSyncReadReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, sizeof(Array), &Array[0]);
			if (nErr) std::cerr << "Error: AdsSyncReadReq: " << nErr << '\n';
			else
			{
				for (nIndex = 0; nIndex < size_of_array; nIndex++) //��forѭ�������ʵ�ֶ�ȡ�����е�Ԫ��
				{
					std::cout << "Array[" << nIndex << "]: " << Array[nIndex] << '\n';
					mem.push_back(Array[nIndex]);
				}
			}

		}
		template <class T>
		void write_value(vector<T>& mem)
		{
			unsigned long lHdlVar2;
			int nIndex;
			short Array[size_of_array];
			char szVar2[] = { "MAIN.Array1" };
			for (nIndex = 0; nIndex < size_of_array; nIndex++) //ͨ��forѭ�������ʵ��Ϊ���鸳ֵ
			{
				Array[nIndex] = mem[nIndex];
			}
			//�õ�Array1�ľ��
			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, sizeof(szVar2), szVar2);
			//if (nErr) cerr << "Error: AdsSyncReadWriteReq: " << nErr << '\n';
			//ͨ�������PLCд������
			nErr = AdsSyncWriteReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, sizeof(Array), &Array[0]);
			//if (nErr) cerr << "Error: AdsSyncReadReq: " << nErr << '\n';

		}

		void write_value(short value, char* str, int size_of_arrays)
		{
			unsigned long lHdlVar2;
			int nIndex;
			short Array[1];
			//char szVar2[] =*str;
			for (nIndex = 0; nIndex < 1; nIndex++) //ͨ��forѭ�������ʵ��Ϊ���鸳ֵ
			{
				Array[nIndex] = value;
			}
			//�õ�Array1�ľ��
			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, size_of_arrays * sizeof(char), (void*)str);
			//if (nErr) cerr << "Error: AdsSyncReadWriteReq: " << nErr << '\n';
			//ͨ�������PLCд������
			nErr = AdsSyncWriteReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, sizeof(Array), &Array[0]);
			//if (nErr) cerr << "Error: AdsSyncReadReq: " << nErr << '\n';

		}

		void write_value_bool(bool value, const char* str, int size_of_arrays)
		{
			unsigned long lHdlVar2;
			int nIndex;
			bool Array[1];
			//char szVar2[] =*str;
			for (nIndex = 0; nIndex < 1; nIndex++) //ͨ��forѭ�������ʵ��Ϊ���鸳ֵ
			{
				Array[nIndex] = value;
			}
			//�õ�Array1�ľ��
			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, size_of_arrays * sizeof(char), (void*)str);
			//if (nErr) cerr << "Error: AdsSyncReadWriteReq: " << nErr << '\n';
			//ͨ�������PLCд������
			nErr = AdsSyncWriteReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, sizeof(Array), &Array[0]);
			//if (nErr) cerr << "Error: AdsSyncReadReq: " << nErr << '\n';

		}

		bool read_value_bool(const char* str, int size_of_arrays)
		{
			unsigned long lHdlVar2;
			int nIndex;
			bool Array[1];
			//�õ�Array1�ľ��
			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, size_of_arrays * sizeof(char), (void*)str);
			//if (nErr) cerr << "Error: AdsSyncReadWriteReq: " << nErr << '\n';
			//ͨ�������PLCд������
			nErr = AdsSyncReadReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, sizeof(Array), &Array[0]);
			if (nErr);// std::cerr << "Error: AdsSyncReadReq: " << nErr << '\n';
			else
			{
				for (nIndex = 0; nIndex < size_of_array; nIndex++) //��forѭ�������ʵ�ֶ�ȡ�����е�Ԫ��
				{
					return Array[nIndex];
				}
			}
		}
		template <class T>
		T* read_array(char * str, int size_of_str, int size_of_array)
		{
			unsigned long lHdlVar2;
			int nIndex;
			T *Array = new T[size_of_array];
			//�õ�Array1�ľ��
			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, size_of_str * sizeof(char), str);
			nErr = AdsSyncReadReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, size_of_array * sizeof(T), Array);
			if (nErr);// std::cerr << "Error: AdsSyncReadReq: " << nErr << '\n';
			else
			{
				;
			}
			return Array;
		}

		template<class T>
		void write_value(T value, const char* str, int size_of_arrays)
		{
			unsigned long lHdlVar2;
			int nIndex;
			T Array[1];
			//char szVar2[] =*str;
			for (nIndex = 0; nIndex < 1; nIndex++) //ͨ��forѭ�������ʵ��Ϊ���鸳ֵ
			{
				Array[nIndex] = value;
			}
			//�õ�Array1�ľ��
			nErr = AdsSyncReadWriteReq(pAddr, ADSIGRP_SYM_HNDBYNAME, 0x0, sizeof(lHdlVar2), &lHdlVar2, size_of_arrays * sizeof(char), (void*)str);
			if (nErr) std::cout << "Error: AdsSyncReadWriteReq: " << nErr << '\n';
			//ͨ�������PLCд������
			nErr = AdsSyncWriteReq(pAddr, ADSIGRP_SYM_VALBYHND, lHdlVar2, sizeof(Array[0]), &Array[0]);
			if (nErr) std::cout << "Error: AdsSyncReadReq: " << nErr << '\n';

		}

		bool readdata(unsigned long indexoffset, bool &value);
		bool readdata(unsigned long indexoffset, float& value);
		bool writeval(int n, unsigned long indexoffset);
		bool writeval();
	};
}