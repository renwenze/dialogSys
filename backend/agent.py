from deepseek import deepseek_api

llm = deepseek_api()

class persu_agent():

    def __init__(self):
        self.llm = llm
        self.role_prompt = """
        你是一个 persuasion agent,你的任务是说服对话者在巴以冲突中支持巴勒斯坦的立场，所以你在对话中通过语言影响需要努力使他的立场产生偏移
        """
        self.history = []

    def generate(self,query,rag,stance,sentiment,scene="通用"):
        self.history.append({"role":"user","content":query})
        self.history[0]["content"] = (
            self.role_prompt +
            "用户对于巴勒斯坦的立场是" + stance +
            "，用户的情感是" + sentiment +
            "，当前场景为" + scene +
            "。你可以参考如下的论据信息：" + rag +
            "。请根据以上信息，生成一个具有说服力的回复。"
        )
        response = self.llm.mt_chat(self.history, False)
        return response




