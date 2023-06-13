#pragma once
constexpr auto class_Place = ".\\data\\3Color\\coloured_pn.json";
constexpr auto ModelPath = "C:\\Users\\Public\\model\\model25x81.pt";

#include<iostream>
#include<string>
#include<fstream>
#include<document.h>
using namespace std;

/*读取json文件*/
inline string read_json(const char* path) {
	ifstream file_json(path);
	if (!file_json.is_open()) {
		cout << "fail to open file";
		exit(1);
	}
	string str((istreambuf_iterator<char>(file_json)), istreambuf_iterator<char>());//将文件的数据流转换位std::string类型
	cout << str << endl;
	file_json.close();
	return str;
}