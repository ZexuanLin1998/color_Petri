#ifndef POLICY_H
#define POLICY_H

#include<string>
#include<atomic>
#include<vector>

#include <torch/torch.h>
#include <torch/script.h>

//神经网络输入81X25 25个特征分别是：标识、目标标识、以等待时间、时延
//变迁个数 119
class Policy {
private:
	int id;
	int num_places;
	int num_transitions;
	int num_features_per_place;
	double max_delay;
	torch::jit::script::Module model;
	torch::Tensor base_features;
	torch::Device targetDevice;


public:
	enum {//输入的25个特征
		MARKING1,
		MARKING2,
		MARKING3,
		MARKING4,
		MARKING5,
		MARKING6,
		MARKING7,
		MARKING8,
		MARKING9,
		MARKING10,
		TARGET_MARKING1,
		TARGET_MARKING2,
		TARGET_MARKING3,
		TARGET_MARKING4,
		TARGET_MARKING5,
		TARGET_MARKING6,
		TARGET_MARKING7,
		TARGET_MARKING8,
		TARGET_MARKING9,
		TARGET_MARKING10,
		WAITED_TIME,
		DELAYS, 
		CAPACITY,
		NUM_PRE_ARCS,
		NUM_POS_ARCS

	};
	std::atomic<bool> is_busy;
	Policy(int num_places, int num_transitions, int num_features_per_place, float* delays, float max_delay, const std::string pt_path);
	Policy(int id, int num_places, int num_transitions, int num_features_per_place, float* delays, float max_delay, float** m_target, float* capacity, float* pre_arcs, float* pos_arcs,const std::string pt_path);
	torch::Tensor forward(const torch::Tensor& features, const torch::Tensor& C_stack, const torch::Tensor& C_t_stack);
	int get_next_optimal_trasition(int num_enable_transitions,
		long long * enable_transitions,
		int num_nonempty_places,
		long long * nonempty_places,
		float* markings,
		float* waiting_times);
	std::vector<float> get_Q(int num_enable_transitions,
		long long * enable_transitions,
		int num_nonempty_places,
		long long * nonempty_places,
		int num_places,
		float** markings,
		float* waiting_times,
		const torch::Tensor& C_stack,
		const torch::Tensor& C_t_stack);
	Policy() : targetDevice(torch::kCPU) {};
};

#endif