#pragma once
constexpr auto class_Place = ".\\data\\3Color\\coloured_pn.json";
constexpr auto ModelPath = "C:\\Users\\Public\\model\\model1.pt";
constexpr auto Place_info = "C:\\Users\\Public\\model\\place_info.csv";
constexpr auto C_pre = "C:\\Users\\Public\\model\\C_pre81x96.csv";
constexpr auto C_post = "C:\\Users\\Public\\model\\C_post81x96.csv";
constexpr auto C_delay = "C:\\Users\\Public\\model\\C_delay.csv";
constexpr auto c_stack0 = "C:\\Users\\Public\\model\\c_stack0.csv";

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

/*读csv文件*/

inline vector<vector<int>> read_csv(const char* path)
{
	std::ifstream file_csv(path);
	std::string lineStr;
	std::vector<vector<int>> datas;
	if (!file_csv.is_open())
	{
		std::cout << "fail to open file" << std::endl;
		exit(1);
	}
	while (getline(file_csv, lineStr))
	{
		vector<string>row;
		vector<int>temp;
		size_t pos = 0;
		string token;
		while ((pos = lineStr.find(",")) != string::npos)
		{
			token = lineStr.substr(0, pos);
			row.push_back(token);
			lineStr.erase(0, pos + 1);
		}
		row.push_back(lineStr);
		for (int i = 0;i < row.size();i++)
		{
			temp.push_back(atoi(row[i].c_str()));
		}
		datas.push_back(temp);
	}
	return datas;
}


/*读一维数组*/
inline vector<int>read_vector(const char* path) {
	vector<int> result;
	ifstream file(path);
	if (!file.is_open()) {
		cout << "can not open file :" << path << endl;
		return {};
	}
	int num;
	while (file >> num)
	{
		result.push_back(num);
	}
	file.close();
	return result;
}