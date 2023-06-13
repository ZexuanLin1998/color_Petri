#pragma once
constexpr auto M0_Path =   "E:\\lzxProject\\CPetriNet\\PetriNet\\PetriNet\\data\\3Color\\M0.txt";
constexpr auto Pre_Path =  "E:\\lzxProject\\CPetriNet\\PetriNet\\PetriNet\\data\\3Color\\Pre.txt";
constexpr auto Post_Path = "E:\\lzxProject\\CPetriNet\\PetriNet\\PetriNet\\data\\3Color\\Post.txt";
constexpr auto C_Path =    "E:\\lzxProject\\CPetriNet\\PetriNet\\PetriNet\\data\\3Color\\C.txt";
constexpr auto Goal_Path = "E:\\lzxProject\\CPetriNet\\PetriNet\\PetriNet\\data\\3Color\\goal_m.txt";
#include<iostream>
#include<vector>
#include<fstream>
#include<string>
#include<utility>
using namespace std;
template<typename T>
vector<T>read_vector(const char* path) {
	vector<T> result;
	ifstream file(path);
	if (!file.is_open()) {
		cout << "can not open file :" << path << endl;
		return {};
	}
	T num ;
	while (file >> num)
	{
		result.push_back(num);
	}
	file.close();
	return result;
}
template<class T1, class T2>
vector<vector<pair<T1, T2>>>read_matrix(const char* path1, const char* path2,int m,int c) {
	vector<vector<pair<T1, T2>>>result(m);
	vector<vector<T1>> matrix(m);
	ifstream file1(path1);
	ifstream file2(path2);
	if (!file1.is_open()&&!file2.is_open()) {
		cout << "can not open file :" << path1 << endl;
		cout << "can not open file :" << path2 << endl;
		return result;
	}
	T1 m_num;
	T2 m_str;
	vector<T1>num;
	vector<T2>str;
	while (file1>>m_num)
	{
		num.push_back(m_num);
	}
	while (file2>>m_str)
	{
		str.push_back(m_str);
	}
	int n = num.size()/m;
	for (int i = 0; i < m; ++i) {
		matrix[i].resize(n, 0);
		for (int j = 0; j < n; ++j) {
			matrix[i][j]=num[i*n + j];
		}
	}
	int C = 0;
	for (int i = 0; i < m; ++i) {
		for (int j = 0; j < n; ++j) {
			if (C < c) {
				result[i].push_back(make_pair(matrix[i][j], str[C++]));
			}
			if (C >= c) 
				C = 0;
		}	
	}
	file1.close();
	file2.close();
	return result;
}