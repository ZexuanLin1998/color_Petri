#include"Policy.h"
#include"WebSocketServer.h"
#include"htime.h"
#include"EventLoop.h"
#include"myWebsocket.h"
#include<iostream>
#include<vector>
#include<string>
#include<utility>
#include"readTxt.h"
#include"petri.h"
#include"read_class_pt.h"
#include<map>


using namespace hv;
using namespace std;

/*当出现错误 C2872 “std”: 不明确的符号
  解决方案:项目-》属性-》c/c++-》语言-》符合模式 改成否
 */


int main() {
	Petri  *pn = new Petri;
	//map<int, string>Places_id_string_translate_int;
	//map<int, string>Trans_id_string_translate_int;
	//map<string, int>Places_id_int_translate_string;
	//map<string, int>Trans_id_int_translate_string;
	vector<pair<int, string>>Places_id_string_translate_int;
	vector<pair<int, string>>Trans_id_string_translate_int;
	vector<pair<string, int>>Places_id_int_translate_string;
	vector<pair<string, int>>Trans_id_int_translate_string;
	pn->js_toPetri(*pn);//解析json中的文件 分别将信息存放在库所类与变迁类中
	pn->init();
	//pn.play(pn);
	/*将库所、变迁进行扩大成实际的数量*/
	int num_places = 0;
	for (auto place : pn->PlacePointer)
	{

		for (auto color : pn->p_colors)
		{
			string id1;
			string id2;
			//Places_id_string_translate_int是将真实的库所的id与库所的名字进行绑定，例:Places_id_string_translate_int[1]==p0y;
			Places_id_string_translate_int.push_back(make_pair(num_places, id1.append(place.first).append(" ").append(color)));
			//Places_id_int_translate_string是将真实的库所的id与库所的名字进行绑定，例:Places_id_int_translate_string[p0y]==1;
			Places_id_int_translate_string.push_back(make_pair(id2.append(place.first).append(" ").append(color), num_places));
			num_places++;
		}
	}
	num_places = 0;
	int num_trans = 0;
	for (auto tran : pn->TransitionPointer)
	{
		for (auto color : pn->t_colors)
		{
			string id1;
			string id2;
			//将Trans_id_string_translate_int是将真实变迁的id与变迁的名字进行绑定，例:Trans_id_int_translate_string[1]=t0y;
			Trans_id_string_translate_int.push_back(make_pair(num_trans, id1.append(tran.first).append(" ").append(color)));
			//将Trans_id_string_translate_int是将变迁的名字与真实变迁的id进行绑定，例:Trans_id_int_translate_string[t0y]=1;
			Trans_id_int_translate_string.push_back(make_pair(id2.append(tran.first).append(" ").append(color), num_trans));
			num_trans++;
		}
	}
	/***********************************************读取聚合矩阵**********************************************************************/
	auto Pre = read_csv(C_pre);
	auto Post = read_csv(C_post);
	auto C_delays = read_csv(C_delay);
	int Pre_row = Pre.size();
	int Pre_column = Pre[0].size();
	int Post_row = Post.size();
	int Post_column = Post[0].size();
	std::vector<vector<vector<int>>>c_stack(4, vector<vector<int>>(81, vector<int>(96, 0)));
	for (int i = 0;i < Pre.size();i++)
	{
		for (int j = 0;j < Pre[0].size();j++)
		{
			if (C_delays[i][0] != 0)
				c_stack[0][i][j] = Pre[i][j];
		}
	}
	for (int i = 0;i < Post.size();i++)
	{
		for (int j = 0;j < Post[0].size();j++)
		{
			if (C_delays[i][0] != 0)
				c_stack[1][i][j] = Post[i][j];
		}
	}
	for (int i = 0;i < Pre.size();i++)
	{
		for (int j = 0;j < Pre[0].size();j++)
		{
			if (C_delays[i][0] == 0)
				c_stack[2][i][j] = Pre[i][j];
		}
	}
	for (int i = 0;i < Post.size();i++)
	{
		for (int j = 0;j < Post[0].size();j++)
		{
			if (C_delays[i][0] == 0)
				c_stack[3][i][j] = Post[i][j];
		}
	}
	torch::Tensor C_stack = torch::zeros({ 4, Pre_row, Pre_column }, torch::kFloat);
	for (int i = 0;i < c_stack.size();i++)
	{
		for (int j = 0;j < c_stack[0].size();j++)
		{
			for (int z = 0;z < c_stack[0][0].size();z++)
			{
				C_stack[i][j][z] = c_stack[i][j][z];
			}
		}
	}
	torch::Tensor C_t_stack = C_stack.transpose(1, 2);
	auto C_stack_0 = read_csv(c_stack0);
	//for (int i = 0;i < C_stack_0.size();i++)
	//{
	//	for (int j = 0;j < C_stack_0[0].size();j++)
	//	{
	//		if (c_stack[0][i][j] != C_stack_0[i][j])
	//		{
	//			exit(1);
	//		}
	//	}
	//}

	/************************************************Websocket开启*******************************************************************************/
	int port = 8080;
	myWebsocket *mws = new myWebsocket(pn);
	mws->ws->ping_interval = 1000000;
	//打开Websocket端口
	mws->ws->onopen = [&](const WebSocketChannelPtr&channel, const HttpRequestPtr&req)
	{
		for (auto place : mws->petri->PlacePointer)
		{
			for (auto color : place.second->colors)
			{
				string place_id;
				string place_num;
				string place_color;
				analysis(place.second->id, " ", place_id, place_color, "p", place_num);
				if (mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->token.size() == 0 ||
					mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->token.find(color) == 
					mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->token.end())
					continue;
				if (mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->token[color] != 0
					&& mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->delay != 0)
					mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->timer->start();
				mws->petri->PlacePointer[atoi(place_num.c_str()) - 1].second->low_exc(*(mws->petri), color);
			}
		}
	};
	//创建回调函数
	mws->ws->onmessage = [&](const WebSocketChannelPtr&channel, const std::string&msg)
	{
		if (msg == "finish" || msg == "admin:123456")
		{
			auto places = pn->PlacePointer;
			auto trans = pn->TransitionPointer;
			for (auto place : places)
			{
				for (auto color : place.second->colors)
				{
					if (place.second->token.size() == 0 || place.second->token.find(color) == place.second->token.end())
						continue;
					if (place.second->timer != nullptr && place.second->token[color] != 0)
						place.second->delay = place.second->timer->finish();
				}
			}
			/************************************计算使能变迁个数*******************************************/
			int num_enable_transitions = 0;
			for (auto tran : trans)
			{
				for (auto color : tran.second->colors)
				{
					if (tran.second->is_enable(*(pn), color))
						num_enable_transitions++;
				}
			}
			long long* enable_transitions = new long long[num_enable_transitions + 1];
			int count = 0;
			for (auto tran : trans)
			{
				for (auto color : tran.second->colors)
				{
					if (tran.second->is_enable(*(pn), color))
					{
						string t;
						t.append(tran.first).append(" ").append(color);
						for (int i = 0;i < Trans_id_int_translate_string.size();i++)
						{
							if (t == Trans_id_int_translate_string[i].first)
								enable_transitions[count] = i;
						}
						//cout << "enable_transitions[" << count << "]" << enable_transitions[count] << endl;
						//enable_transitions[count] = Trans_id_int_translate_string[t];
						count++;
					}
				}
			}
			count = 0;
			/***************************************寻找有token的库所**********************************************************/
			vector<string>num_nonempty_places;
			//int num_nonempty_places = 0;
			for (auto place : places)
			{
				for (auto color : place.second->colors)
				{
					if (place.second->token.size() == 0 || place.second->token.find(color) == place.second->token.end())
						continue;
					if (place.second->token[color] != 0)
						num_nonempty_places.push_back(place.first);
				}
			}
			long long* nonempty_places = new long long[num_nonempty_places.size() + 1];
			//long long* real_nonempty_places = new long long[num_nonempty_places.size() + 1];
			/*********************************************给markings申请空间与赋值****************************************************/
			float** markings = new float*[pn->p_colors.size()];
			for (int row = 0;row < pn->p_colors.size();row++)
			{
				markings[row] = new float[pn->PlacePointer.size()];
			}
			for (int i = 0;i < pn->p_colors.size();i++)
			{
				
				for (auto place : places)
				{
					string place_id;
					string place_color;
					string place_num;
					analysis(place.second->id, " ", place_id, place_color, "p", place_num);
					if (place.second->token.size() == 0 || place.second->token.find(pn->p_colors[i]) == place.second->token.end())
					{
						markings[i][atoi(place_num.c_str()) - 1] = 0;
						continue;
					}
					if (place.second->token[pn->p_colors[i]] != 0)
					{
						nonempty_places[count] = atoi(place_num.c_str())-1;
						cout << nonempty_places[count] << endl;
						count++;
						//string str = place_id.append(" ").append(place.second->colors[i]);
						//for (int j = 0;j < Places_id_int_translate_string.size();j++)
						//{
						//	if (str == Places_id_int_translate_string[j].first)
						//	{
						//		//nonempty_places[count++] = atoi(place_num.c_str()) - 1;
						//		nonempty_places[count] = j;
						//		count++;
						//	}
						//}
						//real_nonempty_places[count] = Places_id_int_translate_string[place_id.append(" ").append(pn->p_colors[i])];
						
						markings[i][atoi(place_num.c_str()) - 1] = place.second->token[pn->p_colors[i]];
						//cout << markings[i][atoi(place_num.c_str()) - 1] <<endl;
						//cout << "markings[" << i << "][" << atoi(place_num.c_str()) - 1 << "]" << place.second->token[pn->p_colors[i]] << endl;
					}
					else
					{
						markings[i][atoi(place_num.c_str()) - 1] = 0;
					}
				}
			}
			count = 0;
			/*****************************************给waiting申请空间和赋值*********************************************************************/
			float* waiting_times = new float[num_nonempty_places.size() + 1];
			for (int i = 0;i != num_nonempty_places.size();i++)
			{
				//cout << Places_id_string_translate_int[real_nonempty_places[i]] << endl;
				string place_id;
				string place_color;
				string place_num;
				//cout << num_nonempty_places[i] << endl;
				//analysis(Places_id_string_translate_int[nonempty_places[i]].second, " ", place_id, place_color, " ", place_num);
				//cout << place_id << endl;
				//int num = nonempty_places[i] - 1;
				//if (num <= 0)
				//	num = 0;
				waiting_times[i] = places[nonempty_places[i]].second->waiting_time;
				if (waiting_times[i] > places[nonempty_places[i]].second->delay)
				{
					waiting_times[i] = places[nonempty_places[i]].second->delay;
				}
				//cout << waiting_times[i] << " ";
			}
			auto temp = pn->policy->get_Q(num_enable_transitions, enable_transitions, num_nonempty_places.size(),
				nonempty_places, pn->PlacePointer.size(), markings, waiting_times, C_stack, C_t_stack);

			std::vector<pair<float, float>>num;
			for (int i = 0;i < temp.size();i++)
			{
				string tran_id;
				string tran_color;
				string tran_num;

				analysis(Trans_id_string_translate_int[i].second, " ", tran_id, tran_color, "t", tran_num);

				if (trans[atoi(tran_num.c_str()) - 1].second->is_enable(*(mws->petri), tran_color))
				{
					num.push_back(make_pair(i, temp[i]));
				}
			}
			/********************************************************************/
			//*将找出的使能变迁的Q值进行比较*/
			auto Max_Q = *std::max_element(num.begin(), num.end(), [](const std::pair<float, float>&p1, const std::pair<float, float>&p2)
			{ return p1.second < p2.second; });
			num.clear();
			int temp2 = std::find(temp.begin(), temp.end(), Max_Q.second) - temp.begin();
			string next_transition_id;
			string next_transition_color;
			string next_transition_num;
			analysis(Trans_id_string_translate_int[temp2].second, " ", next_transition_id, next_transition_color, "t", next_transition_num);
			std::cout << "file transition: " << next_transition_id << " " << next_transition_color << "\n";
			if (trans[atoi(next_transition_num.c_str()) - 1].second->is_enable(*(pn), next_transition_color))
			{

				for (auto place : trans[atoi(next_transition_num.c_str()) - 1].second->transition_pre)
				{
					string place_id;
					string place_color;
					string place_num;
					analysis(place.first, " ", place_id, place_color, "p", place_num);
					while (places[atoi(place_num.c_str()) - 1].second->judge_alive(*(mws->petri), place.second[next_transition_color]));
				}

				mws->petri->updata_waitingtime(next_transition_id);
				for (auto place : trans[atoi(next_transition_num.c_str()) - 1].second->transition_pos)
				{
					string place_id;
					string place_color;
					string place_num;
					analysis(place.first, " ", place_id, place_color, "p", place_num);
					cout << "execute " << places[atoi(place_num.c_str()) - 1].second->id << " " << place.second[next_transition_color] << " ";
					places[atoi(place_num.c_str()) - 1].second->low_exc(*(mws->petri), place.second[next_transition_color]);
				}
				cout << endl;
				string tran_id_num = "t";
				tran_id_num.append(to_string(next_transition_num)).append(",").append(to_string(next_transition_color));
				channel->send(tran_id_num);
				trans[atoi(next_transition_num.c_str()) - 1].second->fire(*(mws->petri), next_transition_color);
				std::cout << std::endl;
			}
			else
			{
				std::cout << next_transition_id << " " << next_transition_color << "不是使能变迁" << std::endl;
			}

			//for (int i = 0;i < pn->p_colors.size();i++)
			//{
			//	string place_id;
			//	string place_color;
			//	string place_num;
			//	for (auto place : places)
			//	{
			//		analysis(place.second->id, " ", place_id, place_color, "p", place_num);
			//		if (place.second->token[pn->p_colors[i]] != 0)
			//		{
			//			//real_nonempty_places[count] = Places_id_int_translate_string[place_id.append(" ").append(pn->p_colors[i])];
			//			nonempty_places[count++] = atoi(place_num.c_str()) - 1;
			//			markings[i][atoi(place_num.c_str()) - 1] = place.second->token[pn->p_colors[i]];
			//			//cout << markings[i][atoi(place_num.c_str()) - 1] <<endl;
			//			//cout << "markings[" << i << "][" << atoi(place_num.c_str()) - 1 << "]" << place.second->token[pn->p_colors[i]] << endl;
			//		}
			//		else
			//		{
			//			markings[i][atoi(place_num.c_str()) - 1] = 0;
			//		}
			//	}
			//}
			for (auto target : mws->petri->m_target)
			{
				string place_id;
				string place_color;
				string place_num;
				analysis(target.first, " ", place_id, place_color, "p", place_num);
				if (target.second.size() == 0)
					continue;
				if (places[atoi(place_num.c_str()) - 1].second->token == target.second)
					exit(1);
			}
			delete[] enable_transitions;
			delete[] nonempty_places;
			delete[] markings;
			delete[] waiting_times;
		}
	};
	mws->ws->onclose = [](const WebSocketChannelPtr& channel)
	{
		printf("onclose\n");
	};

	HttpService* router = new HttpService;
	router->GET("*", [](HttpRequest* req, HttpResponse* resp) {
		std::string url = req->url;
		std::cout << url.c_str() << std::endl;
		int pos = url.find_last_of("/");
		auto str = url.substr(pos + 1, url.size() - pos - 1);
		std::cout << "request file :" << str.c_str() << std::endl;
		if (str.size() <= 1)
			return resp->File("4.14.html");
		return resp->File(str.c_str());
	});

	router->POST("*", [](const HttpContextPtr& ctx) {
		Json data = ctx->json();
		std::string file_path = ".\\";
		file_path.append("pn");
		file_path += ".json";
		std::ofstream file(file_path.c_str());
		file << hv::to_string(data);
		file.close();
		std::cout << data["title"] << std::endl;
		return 0;
		//return ctx->send(ctx->body(), ctx->type());
	});


	websocket_server_t* server = new websocket_server_t;
	server->port = port;
	server->ws = mws->ws;
	server->service = router;
	/*std::thread t1(websocket_server_run, server, 1);

	t1.join();*/
	websocket_server_run(server);





	//while (1)
	//{
	//	

	//	
	//	/*******************************************/
	//	
	//	/*******************************************/
	//	
	//	/*for (int i = 0;i < 10;i++)
	//	{
	//		for (int j = 0;j < pn->PlacePointer.size();j++)
	//		{
	//			cout << markings[i][j] << " ";
	//		}
	//		cout << endl;
	//	}*/
	//	//float* waiting_times = new float[num_nonempty_places.size() + 1];
	//	//for (int i = 0;i != num_nonempty_places.size();i++)
	//	//{
	//	//	//cout << Places_id_string_translate_int[real_nonempty_places[i]] << endl;
	//	//	string place_id;
	//	//	string str2;
	//	//	string str3;
	//	//	//cout << num_nonempty_places[i] << endl;
	//	//	analysis(Places_id_string_translate_int[real_nonempty_places[i]], " ", place_id, str2, " ", str3);
	//	//	//cout << place_id << endl;
	//	//	waiting_times[i] = places[place_id]->waiting_time;
	//	//	if (waiting_times[i] > places[place_id]->delay)
	//	//	{
	//	//		waiting_times[i] = places[place_id]->delay;
	//	//	}
	//	//	//cout << waiting_times[i] << " ";
	//	//}
	//	auto temp = pn->policy->get_Q(num_enable_transitions, enable_transitions, num_nonempty_places.size(),
	//		nonempty_places, pn->PlacePointer.size(), markings, waiting_times);
	//	std::map<float, float>num;
	//	/*从temp寻找使能变迁*/
	//	for (int i = 0;i < temp.size();i++)
	//	{
	//		string tran_id;
	//		string tran_color;
	//		string tran_num;
	//		analysis(Trans_id_string_translate_int[i], " ", tran_id, tran_color, "t", tran_num);

	//		if (trans[tran_id]->is_enable(*(pn), tran_color))
	//		{
	//			num.insert(make_pair(i, temp[i]));
	//		}
	//	}
	//	/*将找出的使能变迁的Q值进行比较*/
	//	auto Max_Q = *std::max_element(num.begin(), num.end(), [](const std::pair<float, float>&p1,
	//		const std::pair<float, float>&p2)
	//	{ return p1.second < p2.second; });
	//	num.clear();
	//	int temp2 = std::find(temp.begin(), temp.end(), Max_Q.second) - temp.begin();
	//	string next_transition_id;
	//	string next_transition_color;
	//	string next_transition_num;
	//	analysis(Trans_id_string_translate_int[temp2], " ", next_transition_id, next_transition_color, "t", next_transition_num);
	//	std::cout << "file transition: " << next_transition_id << " " << next_transition_color << "\n";
	//	if (trans[next_transition_id]->is_enable(*(pn), next_transition_color))
	//	{
	//		for (auto place : trans[next_transition_id]->transition_pre)
	//		{
	//			while (places[place.first]->judge_alive(*(pn), place.second[next_transition_color]));
	//		}

	//		trans[next_transition_id]->fire(*(pn), next_transition_color);
	//		for (auto place : trans[next_transition_id]->transition_pos)
	//		{
	//			cout << "execute " << places[place.first]->id << " " << place.second[next_transition_color] << " ";
	//			if (places[place.first]->id == "p5")
	//			{
	//				int c = 0;
	//			}
	//			places[place.first]->low_exc(*(pn), place.second[next_transition_color]);
	//		}
	//		cout << endl;
	//	}

	//}
	return 0;
}

