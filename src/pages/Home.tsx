import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Users, 
  Building, 
  Shield, 
  Zap,
  Star,
  ArrowRight,
  Play,
  Mail,
  Phone,
  MapPin,
  Package,
  ShoppingCart,
  Truck,
  Store,
  Receipt,
  UserCheck,
  Headphones,
  BookOpen,
  GraduationCap,
  Cpu,
  Wrench,
  Monitor,
  Smartphone,
  Wifi,
  Bot,
  Activity,
  Printer,
  Microchip,
  Lightbulb,
  Globe,
  Award,
  Clock,
  MessageCircle,
  Download,
  FileText,
  Users2,
  Target,
  BarChart3,
  Settings,
  HelpCircle
} from 'lucide-react';

const Home = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const categories = [
    {
      icon: <Cpu className="h-8 w-8" />,
      title: "Arduino",
      description: "A plataforma mais popular para prototipagem. Kits completos e componentes avulsos para você aprender e inovar.",
      cta: "Ver Kits Arduino"
    },
    {
      icon: <Printer className="h-8 w-8" />,
      title: "CNC e Impressão 3D",
      description: "Transforme seus designs digitais em objetos físicos com nossas soluções para fabricação digital.",
      cta: "Explorar CNC e Impressão 3D"
    },
    {
      icon: <Microchip className="h-8 w-8" />,
      title: "Componentes Eletrônicos",
      description: "Resistores, capacitores, LEDs, transistores e muito mais. A base para qualquer projeto eletrônico.",
      cta: "Comprar Componentes"
    },
    {
      icon: <Monitor className="h-8 w-8" />,
      title: "Displays",
      description: "Dê uma interface visual aos seus projetos com displays LCD, OLED e outros.",
      cta: "Ver Displays"
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Kits Diversos",
      description: "Kits temáticos para diferentes aplicações, desde automação residencial até projetos de IoT.",
      cta: "Descobrir Kits"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Motores",
      description: "Movimento e controle para seus robôs e sistemas automatizados.",
      cta: "Escolher Motores"
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: "Prototipagem",
      description: "Protoboards, jumpers, fontes e tudo o que você precisa para montar e testar seus circuitos.",
      cta: "Acessórios de Prototipagem"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Raspberry Pi",
      description: "Mini computadores versáteis para projetos complexos e embarcados.",
      cta: "Conhecer Raspberry Pi"
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: "Robótica",
      description: "Construa seu próprio robô com nossos kits e componentes especializados.",
      cta: "Kits de Robótica"
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: "Sensores e Módulos",
      description: "Colete dados do ambiente e interaja com o mundo físico.",
      cta: "Ver Sensores e Módulos"
    },
    {
      icon: <Wifi className="h-8 w-8" />,
      title: "Wireless e IoT",
      description: "Conecte seus projetos à internet e crie soluções inteligentes.",
      cta: "Soluções Wireless e IoT"
    }
  ];

  const differentials = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "5+ Anos de Experiência",
      description: "Liderança e conhecimento comprovados no mercado."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "5 Mil Clientes Satisfeitos",
      description: "Uma comunidade crescente de inovadores."
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Kits Didáticos Exclusivos",
      description: "Aprenda fazendo com materiais desenvolvidos por especialistas."
    },
    {
      icon: <Headphones className="h-6 w-6" />,
      title: "Suporte Técnico Gratuito",
      description: "Nossos especialistas ao seu lado em cada etapa."
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Preços Imbatíveis",
      description: "Qualidade e inovação acessíveis para todos."
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Atendimento Humanizado",
      description: "Um time dedicado a entender e atender suas necessidades."
    }
  ];

  const educationalBenefits = [
    {
      icon: <Package className="h-6 w-6" />,
      title: "Kits Didáticos Completos",
      description: "Soluções prontas para uso em sala de aula, com foco no aprendizado prático."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Apostilas e E-books Gratuitos",
      description: "Conteúdo de apoio desenvolvido por especialistas para facilitar o ensino e a aprendizagem."
    },
    {
      icon: <Users2 className="h-6 w-6" />,
      title: "Suporte Pedagógico",
      description: "Nossa equipe está pronta para auxiliar na implementação de projetos e laboratórios de robótica em sua escola."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Soluções Personalizadas",
      description: "Kits e componentes adaptados às necessidades específicas de cada instituição de ensino."
    }
  ];

  const businessBenefits = [
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "Atendimento Personalizado",
      description: "Consultoria especializada para identificar as melhores soluções para suas necessidades."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Orçamentos Sob Demanda",
      description: "Preços competitivos e condições flexíveis para grandes volumes de compra."
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      title: "Condições Especiais de Faturamento",
      description: "Facilidade e agilidade nas transações comerciais."
    },
    {
      icon: <Store className="h-6 w-6" />,
      title: "Amplo Catálogo de Produtos",
      description: "Acesso a uma diversidade de componentes e kits de alta qualidade."
    }
  ];

  return (
    <div className="min-h-screen bg-[#E0F2F7]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#E0F2F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#0056B3] to-[#003366] rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#001F3F]">Wolfx</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
                Sobre Nós
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
                Produtos
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('educational')?.scrollIntoView({ behavior: 'smooth' })}>
                Robótica Educacional
              </Button>
              {/* <Button variant="ghost" onClick={() => document.getElementById('business')?.scrollIntoView({ behavior: 'smooth' })}>
                Soluções Empresariais
              </Button> */}
              <Button variant="ghost" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                Contato
              </Button>
              <Button className="bg-[#0056B3] hover:bg-[#003366] text-white">
                <a href="/login">Entrar</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#E0F2F7] to-white">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-[#007BFF] text-white" variant="secondary">
            🚀 Eletrônica • Robótica • Automação
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-[#001F3F] mb-6">
            Desperte Seu Lado Maker.
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0056B3] to-[#003366]">
              {" "}Crie o Futuro com a Wolfx.
            </span>
          </h1>
          <p className="text-xl text-[#003366] mb-8 max-w-4xl mx-auto">
            Sua parceira completa em eletrônica, robótica e automação. Da ideia à inovação, 
            oferecemos os componentes, kits e o suporte que você precisa para transformar 
            seus projetos em realidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* <Button size="lg" className="bg-[#0056B3] hover:bg-[#003366] text-white">
              Explore Nossos Produtos
            </Button> */}
            {/* <Button size="lg" variant="outline" className="border-[#0056B3] text-[#0056B3] hover:bg-[#0056B3] hover:text-white">
              Conheça Nossas Soluções para Você
            </Button> */}
          </div>
          <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-[#003366]">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#0056B3] mr-1" />
              Mais de 5 anos de experiência
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#0056B3] mr-1" />
              5000 mil clientes satisfeitos
            </div>
            {/* <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#0056B3] mr-1" />
              Suporte técnico gratuito
            </div> */}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#001F3F] mb-4">
              Inovação e Paixão Maker
            </h2>
            <p className="text-xl text-[#003366] max-w-4xl mx-auto leading-relaxed">
              Com mais de 5 anos de experiência e a confiança de mais de 5 mil clientes em todo o Brasil, 
              a Wolfx é a sua parceira ideal para mergulhar no universo da eletrônica, robótica e automação. 
              Somos especialistas em transformar ideias em realidade, oferecendo não apenas produtos de alta 
              qualidade, mas também o conhecimento e o suporte que impulsionam seus projetos. Nosso compromisso 
              é com a sua jornada, desde o primeiro protótipo até a solução final, garantindo uma experiência 
              de compra impecável e um pós-venda que realmente faz a diferença. 
              Na Wolfx, somos 100% Maker e estamos prontos para construir o futuro com você.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {differentials.map((differential, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-[#E0F2F7]">
                <CardHeader>
                  <div className="p-3 bg-[#E0F2F7] rounded-lg w-fit">
                    <div className="text-[#0056B3]">
                      {differential.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-[#001F3F]">{differential.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#003366]">{differential.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-[#E0F2F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#001F3F] mb-4">
              Seu Projeto Começa Aqui: Explore Nosso Catálogo Completo
            </h2>
            <p className="text-xl text-[#003366] max-w-3xl mx-auto">
              Na Wolfx, você encontra tudo o que precisa para dar vida às suas criações. Nosso catálogo é 
              cuidadosamente selecionado para atender desde o entusiasta iniciante até o desenvolvedor mais 
              experiente, com uma vasta gama de componentes e kits nas áreas de eletrônica, robótica e automação. 
              Qualidade, variedade e inovação são as marcas registradas dos nossos produtos.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow bg-white">
                <CardHeader>
                  <div className="p-3 bg-[#E0F2F7] rounded-lg w-fit mb-4">
                    <div className="text-[#0056B3]">
                      {category.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-[#001F3F]">{category.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#003366] mb-4">{category.description}</p>
                  {/* <Button variant="outline" className="border-[#0056B3] text-[#0056B3] hover:bg-[#0056B3] hover:text-white">
                    {category.cta}
                  </Button> */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Robotics Section */}
      <section id="educational" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#001F3F] mb-4">
              Transformando o Aprendizado: Robótica Educacional com a Wolfx
            </h2>
            <p className="text-xl text-[#003366] max-w-4xl mx-auto leading-relaxed">
              Acreditamos que a educação do futuro se constrói hoje, com experiências práticas e inovadoras. 
              A Wolfx é pioneira no fornecimento de soluções em robótica educacional, capacitando escolas, 
              professores e alunos a explorarem o mundo da eletrônica, programação e automação de forma 
              envolvente e eficaz. Nossos kits didáticos e apostilas são desenvolvidos com rigor pedagógico, 
              alinhados aos conceitos STEAM e à Cultura Maker, preparando as novas gerações para os desafios 
              do amanhã. Junte-se a nós e torne sua instituição um polo de inovação e tecnologia.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {educationalBenefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-[#E0F2F7]">
                <CardHeader>
                  <div className="p-3 bg-[#E0F2F7] rounded-lg w-fit">
                    <div className="text-[#0056B3]">
                      {benefit.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-[#001F3F]">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#003366]">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[#0056B3] hover:bg-[#003366] text-white">
                Saiba Mais sobre Robótica nas Escolas
              </Button>
              <Button size="lg" variant="outline" className="border-[#0056B3] text-[#0056B3] hover:bg-[#0056B3] hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Baixe Nosso E-book Gratuito
              </Button>
            </div> */}
          </div>
        </div>
      </section>

      {/* Business Solutions Section */}
      <section id="business" className="py-20 bg-[#E0F2F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#001F3F] mb-4">
              Parceria Estratégica: Soluções Eletrônicas para o Seu Negócio
            </h2>
            <p className="text-xl text-[#003366] max-w-4xl mx-auto leading-relaxed">
              Para empresas que buscam excelência em prototipagem, desenvolvimento de produtos ou otimização 
              de processos, a Wolfx é a parceira ideal. Com um vasto catálogo de componentes eletrônicos e 
              kits de automação, oferecemos soluções robustas e personalizadas para atender às demandas do 
              mercado corporativo. Nossa experiência e capacidade de fornecimento em larga escala garantem 
              que seu projeto, do conceito à produção, tenha o suporte e os recursos necessários para o sucesso.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {businessBenefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow bg-white">
                <CardHeader>
                  <div className="p-3 bg-[#E0F2F7] rounded-lg w-fit">
                    <div className="text-[#0056B3]">
                      {benefit.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-[#001F3F]">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#003366]">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
                     <div className="text-center">
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button size="lg" className="bg-[#0056B3] hover:bg-[#003366] text-white">
                 Solicite um Orçamento Personalizado
               </Button>
             </div>
           </div>
        </div>
      </section>

      

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0056B3] to-[#003366]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
             Sua Jornada de Inovação Começa Aqui
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Seja você um entusiasta buscando seu próximo projeto, um educador transformando vidas através 
            da robótica, ou uma empresa impulsionando a inovação, a Wolfx está ao seu lado. Somos mais 
            do que uma loja de componentes; somos um ecossistema de aprendizado, suporte e tecnologia, 
            dedicado a capacitar criadores e inovadores em todo o Brasil. Explore nosso site, descubra 
            as infinitas possibilidades e junte-se à comunidade Wolfx. O que você vai criar hoje?
          </p>
                     <div className="flex flex-col sm:flex-row gap-4 justify-center">
             {/* <Button size="lg" variant="secondary">
               Explore Nossos Produtos
             </Button>
             <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#0056B3]">
               Fale Conosco
             </Button> */}
             {/* <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-[#0056B3]">
               Robótica nas Escolas
             </Button> */}
           </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-[#E0F2F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-[#001F3F] mb-4">
                Fale Conosco: Sua Conexão com a Inovação
              </h2>
              <p className="text-[#003366] mb-8">
                Tem dúvidas, precisa de suporte técnico, deseja um orçamento personalizado para sua empresa 
                ou quer saber mais sobre nossas soluções educacionais? Nossa equipe está pronta para atendê-lo. 
                Entre em contato conosco pelos canais abaixo e descubra como a Wolfx pode impulsionar seus projetos.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-[#0056B3] mr-3" />
                  <span className="text-[#003366]">(48) 8811-4708</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 text-[#0056B3] mr-3" />
                  <span className="text-[#003366]">(48) 8811-4708</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-[#0056B3] mr-3" />
                  <span className="text-[#003366]">contato@wolfx.com</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-[#003366] mr-3" />
                  <span className="text-[#003366]">Segunda a Sexta, das 8h às 17h</span>
                </div>
              </div>
            </div>
            <div>
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-[#001F3F]">Envie Sua Mensagem</CardTitle>
                  <CardDescription className="text-[#003366]">
                    Preencha o formulário e nossa equipe entrará em contato.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <input
                      type="text"
                      placeholder="Nome Completo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                    />
                    <input
                      type="email"
                      placeholder="E-mail"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                    />
                    <input
                      type="text"
                      placeholder="Telefone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                    />
                    <input
                      type="text"
                      placeholder="Assunto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                    />
                    <textarea
                      placeholder="Mensagem"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
                    />
                    <Button type="submit" className="w-full bg-[#0056B3] hover:bg-[#003366] text-white">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001F3F] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-[#0056B3] to-[#003366] rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Wolfx</span>
              </div>
              <p className="text-gray-300">
                Inovação, Qualidade e Suporte para Seus Projetos de Eletrônica, Robótica e Automação.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produtos</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Arduino</a></li>
                <li><a href="#" className="hover:text-white">Raspberry Pi</a></li>
                <li><a href="#" className="hover:text-white">Componentes</a></li>
                <li><a href="#" className="hover:text-white">Kits de Robótica</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Soluções</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Robótica Educacional</a></li>
                <li><a href="#" className="hover:text-white">Soluções Empresariais</a></li>
                <li><a href="#" className="hover:text-white">Suporte Técnico</a></li>
                <li><a href="#" className="hover:text-white">Consultoria</a></li>
              </ul>
            </div>
            <div>
                             <h3 className="font-semibold mb-4">Recursos</h3>
               <ul className="space-y-2 text-gray-300">
                 <li><a href="#" className="hover:text-white">Tutoriais</a></li>
                 <li><a href="#" className="hover:text-white">E-books Gratuitos</a></li>
                 <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
               </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="/admin/login" className="hover:text-white">Painel Master</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 Wolfx. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 