#include "Policy.h"
#include<iostream>
#include"read_class_pt.h"
#include <exception>
//const std::string model_path = "C:\\Users\\Public\\model\\dc.pt";
#define CUDA = 0
Policy::Policy(int num_places, int num_transitions, int num_features_per_place, float* delays, float max_delay, const std::string pt_path) :
	num_places(num_places),
	num_transitions(num_transitions),
	num_features_per_place(num_features_per_place),
	max_delay(max_delay),
	model(torch::jit::load(pt_path)),
	targetDevice(torch::kCPU) {
	base_features = torch::zeros({ 1, num_places, num_features_per_place }, torch::kFloat);
	base_features.index_put_({ 0, "...", 2 }, torch::from_blob(delays, num_places, torch::kFloat) / max_delay);
}

Policy::Policy(int id, int num_places, int num_transitions, int num_features_per_place, float* delays, float max_delay, float* m_target, float* capacity, float* pre_arcs, float* pos_arcs,const std::string pt_path) :id(id),
num_places(num_places),
num_transitions(num_transitions),
num_features_per_place(num_features_per_place),
max_delay(max_delay),
model(torch::jit::load(pt_path)),
targetDevice(torch::kCPU) {
#ifdef CUDA
	if (torch::cuda::is_available() && torch::cuda::cudnn_is_available()) {
		std::cout << "GPU is available -> Switch to GPU model  " << std::endl;
		targetDevice = torch::kCUDA;
	}
#endif // CUDA


	model.eval();
	model.to(targetDevice);
	
	base_features = torch::zeros({ 1, num_places, num_features_per_place }, torch::kFloat);//创建一个1维num_places*num_features_per_place的向量 81*25
	base_features.index_put_({ 0, "...", DELAYS }, torch::from_blob(delays, num_places, torch::kFloat));
	base_features.index_put_({ 0, "...", CAPACITY }, torch::from_blob(capacity, num_places, torch::kFloat));
	base_features.index_put_({ 0, "...", NUM_PRE_ARCS }, torch::from_blob(pre_arcs, num_places, torch::kFloat));
	base_features.index_put_({ 0, "...", NUM_POS_ARCS }, torch::from_blob(pos_arcs, num_places, torch::kFloat));
	base_features.index_put_({ 0, "...", TARGET_MARKING }, torch::from_blob(m_target, num_places, torch::kFloat));

}

torch::Tensor Policy::forward(const torch::Tensor& features, const torch::Tensor& C_stack, const torch::Tensor& C_t_stack) {

	if (targetDevice == torch::kCPU)
	{
		//std::cout << features << std::endl;
		std::vector<torch::jit::IValue> inputs;
		inputs.push_back(features);
	    inputs.push_back(C_t_stack);
		inputs.push_back(C_stack);
		/*检测错误*/
		//try {
		//	// 运行模型
		//	torch::Tensor output = model.forward({ inputs }).toTensor();;
		//	// 输出结果
		//	std::cout << "Model output: " << output << std::endl;
		//}
		//catch (const std::exception& e) {
		//	// 处理异常
		//	std::cerr << "Error: " << e.what() << std::endl;
		//}
		
		return model.forward({ inputs }).toTensor();
	}
	//std::cout << features << std::endl;
	std::vector<torch::jit::IValue> inputs;
	//torch::NoGradGuard no_grad;
	auto input = features.to(targetDevice);
	//std::cout << "input device :" << input.device() <<'\n';
	//exit(-1);
	inputs.push_back(input);
	return model.forward(inputs).toTensor();
}

int Policy::get_next_optimal_trasition(
	int num_enable_transitions,
	long long* enable_transitions,
	int num_nonempty_places,
	long long* nonempty_places,
	float* markings,
	float* waiting_times) {
	if (num_enable_transitions == 0) { return -1; }
	torch::Tensor nonempty_places_tensor = torch::from_blob(nonempty_places, num_nonempty_places, torch::kLong);
	base_features.index_put_({ 0, nonempty_places_tensor, 0 },
		torch::from_blob(markings, num_nonempty_places, torch::kFloat));
	base_features.index_put_({ 0, nonempty_places_tensor, 1 },
		torch::from_blob(waiting_times, num_nonempty_places, torch::kFloat) / max_delay);
	torch::Tensor q_values;
	/*try { q_values = forward(base_features); }
	catch (c10::Error &msg) {
		std::cout << msg.msg().c_str() << std::endl;
	};*/
	auto mask = torch::ones_like(q_values, torch::kBool);
	mask.index_put_({ 0, torch::from_blob(enable_transitions, num_enable_transitions, torch::kLong) }, false);
	q_values.masked_fill_(mask, -FLT_MAX);
	int next_optimal_trasition = torch::argmax(q_values, 1).item<int>();
	base_features.index_put_({ 0, nonempty_places_tensor, 0 }, 0);
	base_features.index_put_({ 0, nonempty_places_tensor, 1 }, 0);
	return next_optimal_trasition;
}

std::vector<float> Policy::get_Q(int num_enable_transitions,
	long long * enable_transitions,
	int num_nonempty_places,
	long long * nonempty_places,
	int num_places,
	float* markings,
	float* waiting_times,
	const torch::Tensor& C_stack,
	const torch::Tensor& C_t_stack
	) {
	is_busy = 1;
	if (num_enable_transitions == 0) { return {}; }
	torch::Tensor nonempty_places_tensor = torch::from_blob(nonempty_places, num_nonempty_places, torch::kLong);
	//std::cout << nonempty_places_tensor << std::endl;
	base_features.index_put_({ 0, "...", MARKING },
		torch::from_blob(markings, num_places, torch::kFloat));
	//std::cout << base_features << std::endl;
	base_features.index_put_({ 0, nonempty_places_tensor, WAITED_TIME },
		torch::from_blob(waiting_times, num_nonempty_places, torch::kFloat));
	auto q_values = forward(base_features, C_stack, C_t_stack).to(torch::kCPU);
	is_busy = 0;
	auto mask = torch::ones_like(q_values, torch::kBool);
	mask.index_put_({ 0, torch::from_blob(enable_transitions, num_enable_transitions, torch::kLong) }, false);
	//q_values.masked_fill_(mask, -FLT_MAX);
	//std::cout << mask << std::endl;
	std::vector<float> ans(q_values.data_ptr<float>(), q_values.data_ptr<float>() + q_values.numel());

	base_features.index_put_({ 0, nonempty_places_tensor, MARKING }, 0);
	base_features.index_put_({ 0, nonempty_places_tensor, WAITED_TIME }, 0);
	//std::cout << base_features << std::endl;
	return ans;
}