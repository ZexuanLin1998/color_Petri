#pragma once
constexpr auto class_Place = ".\\data\\3Color\\coloured_pn.json";
constexpr auto ModelPath = "C:\\Users\\Public\\model\\model25x81.pt";

#include<iostream>
#include<string>
#include<fstream>
#include<document.h>
using namespace std;

/*��ȡjson�ļ�*/
inline string read_json(const char* path) {
	ifstream file_json(path);
	if (!file_json.is_open()) {
		cout << "fail to open file";
		exit(1);
	}
	string str((istreambuf_iterator<char>(file_json)), istreambuf_iterator<char>());//���ļ���������ת��λstd::string����
	cout << str << endl;
	file_json.close();
	return str;
}