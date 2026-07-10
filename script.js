/* ============================================
   Form Elektrik — Ana site etkileşimleri
   ============================================ */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ===== Dil ===== */
  const I18N = {
    tr: {
      'nav.services': 'Çözümler', 'nav.about': 'Kurumsal', 'nav.projects': 'Referanslar',
      'nav.brands': 'Markalarımız', 'nav.blog': 'Blog', 'nav.careers': 'Kariyer', 'nav.contact': 'İletişim', 'nav.quote': 'İletişime Geçin',
      'hero.eyebrow': "2000'den beri enerji mühendisliği",
      'hero.title': 'Geleceğin enerjisini bugünden şekillendiriyoruz.',
      'hero.sub': 'Şebeke koruma ve otomasyondan yenilenebilir enerjiye, enerji depolamadan e-mobiliteye — enerjinin iletim, dağıtım ve tüketim süreçlerinde uçtan uca akıllı çözümler sunuyoruz.',
      'hero.cta1': 'İletişime Geçin', 'hero.cta2': 'Çözümlerimiz',
      'hero.b1': '25+ yıl deneyim', 'hero.b2': 'Mühendislik odaklı', 'hero.b3': 'Dünya markaları', 'hero.float': 'Tamamlanan proje',
      'stat.years': 'Yıl Deneyim', 'stat.experts': 'Uzman Kadro', 'stat.projects': 'Proje ve Çözüm', 'stat.products': 'Ürün ve Ekipman',
      'services.eyebrow': 'Neler Yapıyoruz?', 'services.title': 'Çözümlerimiz',
      'services.lead': 'Enerji altyapıları ve güç sistemleri alanında, mühendislik odaklı uçtan uca çözümler.',
      'about.eyebrow': 'Hakkımızda', 'about.title': 'Enerji Altyapıları İçin Güvenilir ve Akıllı Çözümler',
      'about.p1': "Form Elektrik, enerji altyapıları ve güç sistemleri alanında uzmanlaşmış, mühendislik odaklı bir teknoloji ve çözüm sağlayıcısıdır. Kurulduğu günden bu yana; orta gerilim şebeke ekipmanları, koruma ve otomasyon sistemleri, yenilenebilir enerji teknolojileri ve enerji depolama çözümleri alanlarında faaliyet göstermektedir.",
      'about.p2': 'Şirketimiz; elektrik dağıtım şebekeleri, endüstriyel tesisler, ticari yapılar ve yenilenebilir enerji projeleri için güvenilir, verimli ve uzun ömürlü sistemler sunmayı hedefler. Bu kapsamda, alanında dünya çapında kabul görmüş markalarla güçlü partnerlikler kurarak, müşterilerimize en güncel ve yüksek performanslı teknolojileri ulaştırır.',
      'about.p3': "Form Elektrik'in yaklaşımı yalnızca ürün tedarikiyle sınırlı değildir. Proje öncesi teknik danışmanlık, doğru ürün seçimi, mühendislik doğrulaması, uygulama desteği ve satış sonrası hizmetler ile uçtan uca bir çözüm anlayışı benimsenir. Orta gerilim koruma ve otomasyon sistemlerinden güneş enerjisi invertörlerine, batarya ve enerji depolama çözümlerinden izleme ve yönetim platformlarına kadar geniş bir ürün ve hizmet yelpazesi sunulmaktadır.",
      'about.p4': 'Müşteri ihtiyaçlarını merkeze alan yapımız, teknik yetkinliğimiz ve uzun vadeli iş birliklerine verdiğimiz önem sayesinde; Form Elektrik, Türkiye’de ve bölge ülkelerde güvenilir bir çözüm ortağı olarak konumlanmaktadır. Enerjinin geleceğini şekillendiren teknolojileri, yerel mühendislik gücüyle birleştirerek daha sürdürülebilir ve güçlü altyapılar inşa etmeye devam ediyoruz.',
      'about.pt1b': 'Dünya markalarıyla partnerlik', 'about.pt1': '— Thytronic, Jean Müller, Growatt, Noja Power ve daha fazlası.',
      'about.pt2b': 'Uçtan uca mühendislik', 'about.pt2': '— danışmanlıktan devreye almaya kadar tek elden.',
      'about.pt3b': 'Bölgesel güç', 'about.pt3': "— Türkiye'de ve bölge ülkelerde güvenilir çözüm ortağı.",
      'about.tlTitle': 'Kilometre Taşları',
      'about.lead': 'Form Elektrik, enerji sektöründe mühendislik bilgisi, global teknoloji iş birlikleri ve saha deneyimini bir araya getirerek sürdürülebilir ve güvenilir çözümler sunar.',
      'about.whoTitle': 'Form Elektrik kimdir?',
      'about.statsEyebrow': 'Tarihçe',
      'about.valuesEyebrow': 'Yaklaşımımız',
      'about.val1t': 'Mühendislik Odağı', 'about.val1d': 'Her projede saha koşullarına uygun, doğrulanmış mühendislik çözümleri tasarlıyoruz.',
      'about.val2t': 'Güvenilir Kalite', 'about.val2d': 'Dünya lideri markalarla çalışıyor, ürün ve uygulamada yüksek standardı koruyoruz.',
      'about.val3t': 'Uçtan Uca Hizmet', 'about.val3d': 'Danışmanlıktan devreye almaya ve satış sonrasına kadar tek elden destek sunuyoruz.',
      'about.val4t': 'Sürdürülebilir Enerji', 'about.val4d': 'Yenilenebilir enerji ve depolama çözümleriyle geleceğin enerjisini bugünden kuruyoruz.',
      'about.heroB1': 'Anadolu OSB Tesisi', 'about.heroB2': 'Dağıtım Şirketi', 'about.heroB3': 'Ortak Girişim',
      // Bir Bakışta
      'about.ovEyebrow': 'Bir Bakışta', 'about.ovTitle': 'Bir Bakışta',
      'about.ovLead': '2000 yılında kurulan Form Elektrik; güçlü mühendislik altyapısı ve uluslararası ortaklıklarıyla şebeke koruma ve otomasyon, güneş enerjisi, enerji depolama ve elektrikli mobilite alanlarında uçtan uca çözümler sunar.',
      'about.ov1l': 'Kuruluş · 25+ yıl tecrübe', 'about.ov2l': "Anadolu OSB'deki tesisimiz", 'about.ov3l': 'İş birliği yapılan dağıtım şirketi', 'about.ov4l': 'Ortak girişim (JV)',
      'about.ovNote': 'Tasarımdan devreye almaya, satıştan eğitime kadar tüm süreçleri kendi mühendislik ekibimizle yürütüyoruz.',
      // Güç ve Mühendislik Altyapısı
      'about.pwEyebrow': 'Mühendislik', 'about.pwTitle': 'Gücümüz ve Mühendislik Altyapımız',
      'about.pwLead': 'Köklü temsilcilikler, uluslararası ortak girişimler ve kendi mühendislik ekibimizle uçtan uca yetkinlik sağlıyoruz.',
      'about.pwFacility': "Anadolu OSB'deki tesisimiz", 'about.pwFacilityD': 'Tasarım, test, devreye alma ve teknik teklif değerlendirmesi için kendi mühendislik altyapımız.',
      'about.pwJvTitle': 'Uluslararası Ortak Girişimlerimiz',
      'about.pwJ1': 'Jean Müller Türkiye', 'about.pwJ1tag': '2015 · JV', 'about.pwJ1d': "Alçak gerilim sigortalı yük ayırıcılar ve güç dağıtımında lider Alman Jean Müller ile kurulan ortak girişim. Temsilcilik 2008'den beri sürüyor.",
      'about.pwJ2': 'Thyeast', 'about.pwJ2tag': '2010 · JV · MENA', 'about.pwJ2d': "Thytronic ile 2010'da MENA bölgesinde satış ve iş geliştirme amacıyla kurulan ortak girişim.",
      // Dört Ana Faaliyet Alanı (PDF)
      'about.fieldsEyebrow': 'Faaliyet Alanları', 'about.fieldsTitle': 'Dört Ana Faaliyet Alanımız', 'about.fieldsLead': 'Enerji değer zincirinin her halkasında uzmanlık',
      'about.f1t': 'Şebeke Koruma ve Otomasyon', 'about.f1d': 'Dağıtım şebekeleri için koruma, otomasyon ve dijitalleşme çözümleri.',
      'about.f2t': 'Güneş Enerjisi (Solar)', 'about.f2d': 'Growatt Türkiye temsilciliği ile inverter ve depolama çözümleri.',
      'about.f3t': 'Enerji Depolama (BESS)', 'about.f3d': 'Li3 markamız ile proje tasarımı, test ve devreye alma.',
      'about.f4t': 'Elektrikli Mobilite', 'about.f4d': 'EPSIS markamız ile Türkiye geneli şarj işletmeciliği.',
      // Sahadaki Gücümüz
      'about.imEyebrow': 'Sahadaki Gücümüz', 'about.imTitle': 'Sahadaki Gücümüz', 'about.imLead': 'Yılların getirdiği, kanıtlanmış saha performansı',
      'about.im1l': 'Thytronic koruma rölesi sahada çalışıyor', 'about.im2l': 'NOJA Power recloser sahada çalışıyor', 'about.im3l': 'Havai hat arıza göstergesi (FID) sahada',
      'about.imProjTitle': 'Uluslararası projelerde Form Elektrik', 'about.imProjD': 'Büyük yurt içi ve uluslararası altyapı projelerinde Form Elektrik mühendisliği ve ürünleri kullanıldı.',
      // Markalar
      'about.brEyebrow': 'Markalar', 'about.brTitle': 'Temsil Ettiğimiz Markalar', 'about.brLead': 'Şebeke tarafında yetkili Türkiye temsilcisi olduğumuz üreticiler',
      'about.brCoop': 'İş birliği',
      'about.br1c': 'Avustralya', 'about.br1d': 'Orta gerilim otomatik kesici ve recloser sistemleri ile şalt ekipmanları.',
      'about.br2c': 'İtalya', 'about.br2d': 'Hat, trafo, motor ve jeneratör koruma röleleri; şebeke otomasyonu.',
      'about.br3c': 'Almanya', 'about.br3d': 'Orta gerilim kısa devre ve toprak arıza göstergeleri, gerilim algılama.',
      'about.br4c': 'İspanya', 'about.br4d': 'Enerji izleme ve ölçüm; alçak gerilim şebeke dijitalleşmesi (Wibeee).',
      // Neden Form Elektrik
      'about.whyEyebrow': 'Neden Biz', 'about.whyTitle': 'Neden Form Elektrik?',
      'about.why1t': 'Yetkili Temsilcilik', 'about.why1d': 'Alanında lider uluslararası üreticilerin Türkiye temsilcisi.',
      'about.why2t': 'Uçtan Uca Yetkinlik', 'about.why2d': 'Tasarım, tedarik, test, devreye alma ve satış sonrası tek elden.',
      'about.why3t': 'Bilgi ve Eğitim', 'about.why3d': 'Dağıtım şirketi ekiplerine teknik eğitim ve danışmanlık.',
      'about.why4t': 'Türkiye Geneli Erişim', 'about.why4d': 'Ülke çapında satış, hizmet ve işletme ağı.',
      'about.why5t': 'Enerji Dönüşümü', 'about.why5d': 'Yenilenebilir, depolama ve mobilitede yeni nesil çözümler.',
      'about.why6t': 'Uzun Vadeli Ortaklık', 'about.why6d': '25 yılı aşkın güvenilir iş ilişkisi geleneği.',
      // CTA
      'about.ctaTitle': 'Birlikte enerjinin geleceğini inşa edelim', 'about.ctaSub': 'Şebeke · Solar · BESS · Mobilite', 'about.ctaBtn': 'İletişime Geçin',
      'about.qpEyebrow': 'Kalite Politikamız', 'about.qpTitle': 'Kalite Politikamız',
      'about.qpLead': 'Elektrik ve enerji sektöründe müşterilerimizin ihtiyaçlarına cevap verebilecek etkin ve nitelikli ürünleri tedarik etmek ve müşteri memnuniyetini en üst seviyede tutmak olarak özetleriz.',
      'about.qp1t': 'Geleceğin Enerjisini Kaliteyle Şekillendiriyoruz', 'about.qp1d': 'Nitelikli ürün tedariği ve yüksek müşteri memnuniyetiyle sektörde öncelikle tercih edilen kuruluş olmayı hedefliyoruz. Dinamik kadromuzla sistemimizi sürekli iyileştiriyor ve güven inşa ediyoruz.',
      'about.qp2t': 'Kurumsal ve Güçlü', 'about.qp2d': 'Yasal mevzuatlara tam uyum ve sürekli gelişim ilkesiyle sektörde model teşkil eden bir kurum olmayı amaçlıyoruz. Dürüstlük ve profesyonellikten ödün vermeden, toplam kalite hedeflerimize ilerliyoruz.',
      'about.qp3t': 'Sektörde Örnek Teşkil Eden Hizmet', 'about.qp3d': 'Çözüm odaklı, dürüst ve ilkeli hizmet anlayışımızla enerjinize değer katıyoruz. Takım ruhuyla hareket ederek kalite standartlarımızı her gün bir adım ileriye taşıyoruz.',
      'about.qp4t': 'İlkelerimizle Güçlenen Kalite Anlayışı', 'about.qp4d': 'Tüm çalışanlarımızın benimsediği etik değerlerle, sektörün en çok güvenilen kuruluşu olma vizyonuyla çalışıyoruz. Samimiyetimizi profesyonel disiplinle birleştirerek sürdürülebilir başarıyı hedefliyoruz.',
      // Timeline (PDF — 9 gerçek olay)
      'about.tlt2000': 'Şirket Kuruluşu', 'about.tlt2008': 'Thytronic & Jean Müller', 'about.tlt2010': 'Thyeast (MENA)', 'about.tlt2012': 'NOJA Power & Horstmann', 'about.tlt2015': 'Jean Müller Türkiye JV', 'about.tlt2021': 'Li3 Depolama', 'about.tlt2022': 'EPSIS Lisansı', 'about.tlt2023': 'İlk Entegre DC Şarj', 'about.tlt2025': 'Smilics',
      'tl.2000': 'Form Elektrik kuruldu.', 'tl.2008': 'Thytronic ve Jean Müller temsilciliği başladı.',
      'tl.2010': 'Thyeast ortak girişimi kuruldu (MENA bölgesi).', 'tl.2012': 'NOJA Power ve Horstmann temsilciliği alındı.',
      'tl.2015': 'Jean Müller Türkiye ortak girişimi (JV) kuruldu.', 'tl.2021': 'Li3 enerji depolama departmanı kuruldu.',
      'tl.2022': 'EPSIS EPDK şarj ağı işletmeci lisansı alındı.', 'tl.2023': "Türkiye'nin ilk entegre depolamalı DC şarj istasyonu.",
      'tl.2025': 'Smilics Türkiye temsilciliği başladı.',
      'video.eyebrow': 'Tanıtım', 'video.title': "Form Elektrik'i tanıyın", 'video.soon': 'Tanıtım videosu yakında eklenecektir.',
      'partners.label': 'Çözüm ortaklarımız',
      'projects.eyebrow': 'Referanslar', 'projects.title': 'Sahada kanıtlanmış işler',
      'projects.lead': 'Kamu ve özel sektörde tamamladığımız seçili projeler.', 'projects.all': 'Tüm Projeler',
      'brands.eyebrow': 'Form Elektrik Grubu', 'brands.title': 'Markalarımız',
      'brands.lead': 'Çatı markamız altında, kendi alanında uzmanlaşmış iş kollarımız.',
      'refs.label': 'Bize güvenen kurumlar',
      'blog.eyebrow': 'Teknik Kütüphane', 'blog.title': 'Blog & Makaleler', 'blog.lead': 'Sektörel gelişmeler, teknik rehberler ve proje notları.', 'blog.all': 'Tüm Yazılar',
      'blogp.search': 'Yazılarda ara…', 'blogp.allAuthors': 'Tüm Yazarlar', 'blogp.allTags': 'Tüm Etiketler', 'blogp.clearTags': 'Temizle', 'blogp.empty': 'Aradığınız ölçütlere uyan yazı bulunamadı.',
      'post.allPosts': 'Tüm yazılar', 'post.loading': 'Yükleniyor…', 'post.related': 'Diğer Yazılar', 'post.toc': 'İçindekiler',
      'cta.title': 'Geleceğin Enerjisini Bugünden Şekillendirin',
      'cta.sub': 'Sürdürülebilir ve akıllı enerji çözümlerinde doğru adımı atın. Projeniz için neler yapabileceğimizi konuşmak üzere hemen iletişime geçin.',
      'cta.contact': 'İletişime Geçin', 'cta.book': 'Görüşme Planla',
      'cta.schedulerTitlePrefix': 'Enerji yönetiminizi', 'cta.schedulerTitleAccent': 'geleceğe taşıyın.',
      'cta.schedulerSub': 'Uzman ekibimizle iletişime geçin. İhtiyaçlarınıza özel çözüm tasarlayalım.',
      'contactForm.title': 'İletişime Geçin', 'contactForm.sub': 'İhtiyacınızı paylaşın, uzman ekibimiz en kısa sürede dönüş yapsın.', 'contactForm.services': 'İlgilendiğiniz konular', 'contactForm.submit': 'Gönder',
      'career.eyebrow': 'Kariyer', 'career.title': 'Enerjinin geleceğini birlikte inşa edelim',
      'career.lead': 'Mühendislik kültürünü, sürekli gelişimi ve güçlü ekip ruhunu önemsiyoruz. Form Elektrik ailesine katılın, enerjinin dönüşümünde rol alın.',
      'career.whyEyebrow': 'Neden Form Elektrik?', 'career.whyTitle': 'Burada çalışmak nasıl?',
      'career.v1t': 'Mühendislik Kültürü', 'career.v1d': 'Saha deneyimi ve mühendislik bilgisini bir araya getiren bir ekiple çalışırsınız.',
      'career.v2t': 'Sürekli Gelişim', 'career.v2d': 'Teknik eğitimler, uluslararası markalarla iş birliği ve gelişim fırsatları.',
      'career.v3t': 'Güçlü Ekip', 'career.v3d': 'Birlikte üreten, dayanışan ve başarıyı paylaşan bir çalışma ortamı.',
      'career.v4t': 'Anlamlı İş', 'career.v4d': 'Yenilenebilir enerji ve dönüşümün merkezinde, geleceğe değer katan projeler.',
      'career.jobsEyebrow': 'Açık Pozisyonlar', 'career.jobsTitle': 'Açık Pozisyonlar',
      'career.heroShort': "Form Elektrik ailesine katılın. Aşağıdaki ilanları inceleyin, detaylar için tıklayın ve CV'nizle başvurun.",
      'career.applyTitle': 'Başvurunuzu yapın', 'career.applySub': 'Açık bir pozisyona ya da genel havuza başvurabilirsiniz. CV’nizi ekleyin, sizinle iletişime geçelim.',
      'career.position': 'Pozisyon', 'career.generalApp': 'Genel Başvuru', 'career.cv': 'CV (PDF / Word)', 'career.cvHint': 'Dosya seçin (PDF, DOC — en fazla 10 MB)', 'career.submit': 'Başvur',
      'contact.eyebrow': 'İletişim', 'contact.title': 'Bize ulaşın', 'contact.lead': 'İhtiyacınız olan her an profesyonel destek için ekibimize ulaşabilirsiniz.',
      'contact.phone': 'Telefon', 'contact.email': 'E-posta', 'contact.address': 'Adres', 'contact.addressVal': 'Ankara, Türkiye',
      'form.firstName': 'Ad', 'form.lastName': 'Soyad', 'form.email': 'E-posta', 'form.phone': 'Telefon', 'form.requiredNote': 'işaretli alanlar zorunludur',
      'form.company': 'Şirket', 'form.interest': 'İlgilendiğiniz çözümler', 'form.message': 'Mesajınız', 'form.submit': 'Gönder',
      'svc.ag-og': 'AG-OG Projelendirme', 'svc.otomasyon': 'Şebeke Koruma ve Otomasyon', 'svc.ges': 'Yenilenebilir Enerji', 'svc.bess': 'Enerji Depolama', 'svc.emobility': 'E-Mobility',
      'footer.about': "Enerji altyapıları ve güç sistemleri alanında mühendislik odaklı, uçtan uca çözüm sağlayıcısı. 2000'den bu yana güvenilir çözüm ortağınız.",
      'footer.solutions': 'Çözümlerimiz', 'footer.corporate': 'Kurumsal', 'footer.contact': 'İletişim',
      'footer.kvkk': 'KVKK Aydınlatması', 'footer.cookie': 'Çerez Politikası', 'footer.rights': '© 2026 Form Elektrik İnş.Müh.A.Ş — Tüm hakları saklıdır.',
      'doc.kvkk-politikasi': 'Genel KVKK Politikası', 'doc.basvuru-formu': 'Başvuru Formu',
      'doc.calisan-adayi': 'Çalışan Adayı Aydınlatma Metni', 'doc.imha-politikasi': 'İmha Politikası',
      'common.loading': 'Yükleniyor…', 'common.close': 'Kapat', 'common.more': 'Detaylı bilgi',
      'appt.title': 'Görüşme Planla', 'appt.calSub': 'Uygun bir tarih seçin.',
      'appt.quick': 'Online Toplantı', 'appt.quickSub': '30 dakikalık ücretsiz görüşme',
      'appt.other': 'Diğer', 'appt.topicTitle': 'Görüşmek istediğiniz konu',
      'appt.topicPh': 'Kısaca konuyu yazın…', 'appt.continue': 'Devam', 'appt.topicLabel': 'Konu',
      'appt.topicsTitle': 'Görüşmek istediğiniz konular',
      'appt.productTitle': 'Hizmet seçin', 'appt.slotTitle': 'Saat seçin', 'appt.formTitle': 'Bilgileriniz',
      'appt.back': 'Geri', 'appt.confirm': 'Randevuyu Oluştur',
      'appt.doneTitle': 'Talebiniz alındı!', 'appt.doneSub': 'Randevu talebiniz oluşturuldu. Onaylandığında size e-posta ile bilgi vereceğiz.',
      'appt.noSlots': 'Bu tarihte uygun saat kalmadı.',
      'msg.leadOk': 'Talebiniz alındı! En kısa sürede dönüş yapacağız.',
      'msg.leadErr': 'Bir hata oluştu. Lütfen tekrar deneyin.',
      'msg.pickService': 'Lütfen en az bir çözüm seçin.',
      'ann.eyebrow': 'Duyurular', 'ann.title': 'Güncel Bilgilendirmeler', 'ann.lead': 'Yeni hizmetler, teknik duyurular ve önemli gelişmeler.', 'ann.all': 'Tüm Duyurular', 'ann.readMore': 'Devamını oku',
      'msg.kvkk': 'Devam etmek için KVKK Aydınlatma Metni\'ni onaylamanız gerekiyor.',
      'kvkk.checkboxLabel': 'KVKK Aydınlatma Metni\'ni okudum ve onaylıyorum.',
      'kvkk.open': 'Metni aç ve onayla', 'kvkk.accept': 'Okudum ve onaylıyorum', 'kvkk.scrollHint': 'Onaylamak için metni en alta kadar kaydırın.',
      'cookie.text': 'Bu site, deneyiminizi iyileştirmek için çerezler kullanır. Ayrıntılar için <a href="/cerez-politikasi" target="_blank" rel="noopener">Çerez Politikamızı</a> inceleyebilirsiniz.',
      'cookie.accept': 'Kabul Et',
      'cookie.reject': 'Reddet',
      'blog.empty': 'Henüz yayınlanmış yazı yok.',
      'projects.empty': 'Yakında referans projelerimizi burada paylaşacağız.',
      'brands.visit': 'Siteyi ziyaret et',
    },
    en: {
      'nav.services': 'Solutions', 'nav.about': 'Company', 'nav.projects': 'References',
      'nav.brands': 'Our Brands', 'nav.blog': 'Blog', 'nav.careers': 'Careers', 'nav.contact': 'Contact', 'nav.quote': 'Get in Touch',
      'hero.eyebrow': 'Energy engineering since 2000',
      'hero.title': 'Shaping the energy of the future, today.',
      'hero.sub': 'From grid protection and automation to renewable energy, from energy storage to e-mobility — we deliver end-to-end smart solutions across transmission, distribution and consumption.',
      'hero.cta1': 'Get in Touch', 'hero.cta2': 'Our Solutions',
      'hero.b1': '25+ years', 'hero.b2': 'Engineering-led', 'hero.b3': 'Global brands', 'hero.float': 'Completed projects',
      'stat.years': 'Years', 'stat.experts': 'Experts', 'stat.projects': 'Projects & Solutions', 'stat.products': 'Products & Equipment',
      'services.eyebrow': 'What We Do', 'services.title': 'Our Solutions',
      'services.lead': 'Engineering-led, end-to-end solutions in energy infrastructure and power systems.',
      'about.eyebrow': 'About Us', 'about.title': 'Reliable and Smart Solutions for Energy Infrastructure',
      'about.p1': 'Form Elektrik is an engineering-led technology and solution provider specialised in energy infrastructure and power systems. Since its founding, it has operated in medium-voltage grid equipment, protection and automation systems, renewable energy technologies and energy storage solutions.',
      'about.p2': 'Our company aims to deliver reliable, efficient and long-lasting systems for electricity distribution grids, industrial facilities, commercial buildings and renewable energy projects. To this end, we build strong partnerships with globally recognised brands and bring our customers the most up-to-date, high-performance technologies.',
      'about.p3': 'Form Elektrik’s approach is not limited to product supply. We adopt an end-to-end solution philosophy with pre-project technical consultancy, correct product selection, engineering validation, implementation support and after-sales service. We offer a broad product and service range — from medium-voltage protection and automation systems to solar inverters, from battery and energy storage solutions to monitoring and management platforms.',
      'about.p4': 'Thanks to our customer-centric structure, technical expertise and our commitment to long-term collaboration, Form Elektrik is positioned as a trusted solution partner in Türkiye and the region. We continue to build more sustainable and powerful infrastructures by combining the technologies shaping the future of energy with local engineering strength.',
      'about.pt1b': 'Partnerships with global brands', 'about.pt1': '— Thytronic, Jean Müller, Growatt, Noja Power and more.',
      'about.pt2b': 'End-to-end engineering', 'about.pt2': '— from consultancy to commissioning, all from one source.',
      'about.pt3b': 'Regional strength', 'about.pt3': '— a trusted partner in Türkiye and the region.',
      'about.tlTitle': 'Milestones',
      'about.lead': 'Form Elektrik brings together engineering knowledge, global technology partnerships and field experience to deliver sustainable and reliable solutions in the energy sector.',
      'about.whoTitle': 'Who is Form Elektrik?',
      'about.statsEyebrow': 'History',
      'about.valuesEyebrow': 'Our Approach',
      'about.val1t': 'Engineering Focus', 'about.val1d': 'We design validated engineering solutions tailored to field conditions on every project.',
      'about.val2t': 'Trusted Quality', 'about.val2d': 'We work with world-leading brands and uphold high standards in product and application.',
      'about.val3t': 'End-to-End Service', 'about.val3d': 'From consultancy to commissioning and after-sales, we provide single-source support.',
      'about.val4t': 'Sustainable Energy', 'about.val4d': 'We build the energy of the future today with renewable and storage solutions.',
      'about.heroB1': 'Anadolu OSB Facility', 'about.heroB2': 'Distribution Companies', 'about.heroB3': 'Joint Ventures',
      // At a Glance
      'about.ovEyebrow': 'At a Glance', 'about.ovTitle': 'At a Glance',
      'about.ovLead': 'Founded in 2000, Form Elektrik delivers end-to-end solutions in grid protection and automation, solar energy, energy storage and electric mobility, backed by strong engineering capability and international partnerships.',
      'about.ov1l': 'Founded · 25+ years of experience', 'about.ov2l': 'Our facility in Anadolu OSB', 'about.ov3l': 'Distribution companies we work with', 'about.ov4l': 'Joint ventures (JV)',
      'about.ovNote': 'From design to commissioning, from sales to training, we run every process with our own engineering team.',
      // Power & Engineering
      'about.pwEyebrow': 'Engineering', 'about.pwTitle': 'Our Strength and Engineering Infrastructure',
      'about.pwLead': 'We provide end-to-end capability with established distributorships, international joint ventures and our own engineering team.',
      'about.pwFacility': 'Our facility in Anadolu OSB', 'about.pwFacilityD': 'Our own engineering infrastructure for design, testing, commissioning and technical proposal evaluation.',
      'about.pwJvTitle': 'Our International Joint Ventures',
      'about.pwJ1': 'Jean Müller Türkiye', 'about.pwJ1tag': '2015 · JV', 'about.pwJ1d': 'A joint venture with German Jean Müller, a leader in LV fused switch-disconnectors and power distribution. The distributorship has continued since 2008.',
      'about.pwJ2': 'Thyeast', 'about.pwJ2tag': '2010 · JV · MENA', 'about.pwJ2d': 'A joint venture established with Thytronic in 2010 for sales and business development in the MENA region.',
      // Four Core Areas
      'about.fieldsEyebrow': 'Areas of Activity', 'about.fieldsTitle': 'Our Four Core Areas', 'about.fieldsLead': 'Expertise at every link of the energy value chain',
      'about.f1t': 'Grid Protection & Automation', 'about.f1d': 'Protection, automation and digitalisation solutions for distribution grids.',
      'about.f2t': 'Solar Energy', 'about.f2d': 'Inverter and storage solutions as the Growatt Türkiye representative.',
      'about.f3t': 'Energy Storage (BESS)', 'about.f3d': 'Project design, testing and commissioning with our Li3 brand.',
      'about.f4t': 'Electric Mobility', 'about.f4d': 'Nationwide charging network operation with our EPSIS brand.',
      // Field Strength
      'about.imEyebrow': 'Field Strength', 'about.imTitle': 'Our Strength in the Field', 'about.imLead': 'Proven field performance built over the years',
      'about.im1l': 'Thytronic protection relays in the field', 'about.im2l': 'NOJA Power reclosers in the field', 'about.im3l': 'Overhead line fault indicators (FID) in the field',
      'about.imProjTitle': 'Form Elektrik in international projects', 'about.imProjD': 'Form Elektrik engineering and products were used in major domestic and international infrastructure projects.',
      // Brands
      'about.brEyebrow': 'Brands', 'about.brTitle': 'Brands We Represent', 'about.brLead': 'Manufacturers for which we are the authorised Türkiye representative on the grid side',
      'about.brCoop': 'Partnership since',
      'about.br1c': 'Australia', 'about.br1d': 'Medium-voltage auto-reclosers and switchgear equipment.',
      'about.br2c': 'Italy', 'about.br2d': 'Line, transformer, motor and generator protection relays; grid automation.',
      'about.br3c': 'Germany', 'about.br3d': 'Medium-voltage short-circuit and earth-fault indicators, voltage detection.',
      'about.br4c': 'Spain', 'about.br4d': 'Energy monitoring and metering; LV grid digitalisation (Wibeee).',
      // Why Us
      'about.whyEyebrow': 'Why Us', 'about.whyTitle': 'Why Form Elektrik?',
      'about.why1t': 'Authorised Representation', 'about.why1d': 'Türkiye representative of leading international manufacturers.',
      'about.why2t': 'End-to-End Capability', 'about.why2d': 'Design, supply, testing, commissioning and after-sales from one source.',
      'about.why3t': 'Knowledge & Training', 'about.why3d': 'Technical training and consultancy for distribution company teams.',
      'about.why4t': 'Nationwide Reach', 'about.why4d': 'A sales, service and operation network across the country.',
      'about.why5t': 'Energy Transition', 'about.why5d': 'Next-generation solutions in renewables, storage and mobility.',
      'about.why6t': 'Long-Term Partnership', 'about.why6d': 'A tradition of trusted business relationships spanning 25+ years.',
      // CTA
      'about.ctaTitle': "Let's build the future of energy together", 'about.ctaSub': 'Grid · Solar · BESS · Mobility', 'about.ctaBtn': 'Get in Touch',
      'about.qpEyebrow': 'Quality Policy', 'about.qpTitle': 'Our Quality Policy',
      'about.qpLead': 'We summarise it as supplying effective and qualified products that meet our customers’ needs in the electricity and energy sector, and keeping customer satisfaction at the highest level.',
      'about.qp1t': 'Shaping the Energy of the Future with Quality', 'about.qp1d': 'We aim to be the preferred company in the sector through qualified product supply and high customer satisfaction. With our dynamic team, we continuously improve our system and build trust.',
      'about.qp2t': 'Corporate and Strong', 'about.qp2d': 'With full compliance with regulations and a principle of continuous improvement, we aim to be a model institution in the sector. We advance toward our total quality goals without compromising on honesty and professionalism.',
      'about.qp3t': 'Exemplary Service in the Sector', 'about.qp3d': 'We add value to your energy with a solution-oriented, honest and principled service approach. Acting with team spirit, we move our quality standards one step forward every day.',
      'about.qp4t': 'A Quality Approach Strengthened by Our Principles', 'about.qp4d': 'With the ethical values embraced by all our employees, we work with the vision of being the most trusted company in the sector. We combine our sincerity with professional discipline to pursue sustainable success.',
      // Timeline (PDF — 9 real events)
      'about.tlt2000': 'Company Founded', 'about.tlt2008': 'Thytronic & Jean Müller', 'about.tlt2010': 'Thyeast (MENA)', 'about.tlt2012': 'NOJA Power & Horstmann', 'about.tlt2015': 'Jean Müller Türkiye JV', 'about.tlt2021': 'Li3 Storage', 'about.tlt2022': 'EPSIS Licence', 'about.tlt2023': 'First Integrated DC Charger', 'about.tlt2025': 'Smilics',
      'tl.2000': 'Form Elektrik was founded.', 'tl.2008': 'Thytronic and Jean Müller representation began.',
      'tl.2010': 'Thyeast joint venture established (MENA region).', 'tl.2012': 'NOJA Power and Horstmann representation acquired.',
      'tl.2015': 'Jean Müller Türkiye joint venture (JV) established.', 'tl.2021': 'Li3 energy storage department established.',
      'tl.2022': 'EPSIS EPDK charging network operator licence obtained.', 'tl.2023': "Türkiye's first integrated-storage DC charging station.",
      'tl.2025': 'Smilics Türkiye representation began.',
      'video.eyebrow': 'Introduction', 'video.title': 'Get to know Form Elektrik', 'video.soon': 'Introduction video coming soon.',
      'partners.label': 'Our solution partners',
      'projects.eyebrow': 'References', 'projects.title': 'Proven work in the field',
      'projects.lead': 'Selected projects delivered in the public and private sectors.', 'projects.all': 'All Projects',
      'brands.eyebrow': 'Form Elektrik Group', 'brands.title': 'Our Brands',
      'brands.lead': 'Specialised business lines under our umbrella brand.',
      'refs.label': 'Trusted by',
      'blog.eyebrow': 'Technical Library', 'blog.title': 'Blog & Articles', 'blog.lead': 'Industry updates, technical guides and project notes.', 'blog.all': 'All Articles',
      'blogp.search': 'Search articles…', 'blogp.allAuthors': 'All Authors', 'blogp.allTags': 'All Tags', 'blogp.clearTags': 'Clear', 'blogp.empty': 'No posts match your filters.',
      'post.allPosts': 'All posts', 'post.loading': 'Loading…', 'post.related': 'Related posts', 'post.toc': 'Contents',
      'cta.title': 'Shape the Energy of the Future Today',
      'cta.sub': 'Take the right step in sustainable and smart energy solutions. Get in touch to discuss what we can do for your project.',
      'cta.contact': 'Get in Touch', 'cta.book': 'Book a Meeting',
      'cta.schedulerTitlePrefix': 'Move your energy management', 'cta.schedulerTitleAccent': 'into the future.',
      'cta.schedulerSub': 'Get in touch with our experts. We will design the right solution for your needs.',
      'contactForm.title': 'Get in Touch', 'contactForm.sub': 'Share your needs and our expert team will get back to you shortly.', 'contactForm.services': 'Topics of interest', 'contactForm.submit': 'Send',
      'career.eyebrow': 'Careers', 'career.title': 'Let’s build the future of energy together',
      'career.lead': 'We value engineering culture, continuous growth and a strong team spirit. Join the Form Elektrik family and take part in the energy transition.',
      'career.whyEyebrow': 'Why Form Elektrik?', 'career.whyTitle': 'What is it like to work here?',
      'career.v1t': 'Engineering Culture', 'career.v1d': 'You work with a team that combines field experience with engineering knowledge.',
      'career.v2t': 'Continuous Growth', 'career.v2d': 'Technical training, collaboration with global brands and development opportunities.',
      'career.v3t': 'Strong Team', 'career.v3d': 'A work environment that produces together, supports each other and shares success.',
      'career.v4t': 'Meaningful Work', 'career.v4d': 'Projects that add value to the future, at the heart of renewable energy and transformation.',
      'career.jobsEyebrow': 'Open Positions', 'career.jobsTitle': 'Open Positions',
      'career.heroShort': 'Join the Form Elektrik family. Browse the postings below, click for details and apply with your CV.',
      'career.applyTitle': 'Submit your application', 'career.applySub': 'Apply to an open position or our general pool. Attach your CV and we will get in touch.',
      'career.position': 'Position', 'career.generalApp': 'General Application', 'career.cv': 'CV (PDF / Word)', 'career.cvHint': 'Choose a file (PDF, DOC — max 10 MB)', 'career.submit': 'Apply',
      'contact.eyebrow': 'Contact', 'contact.title': 'Reach us', 'contact.lead': 'Our team is here to provide professional support whenever you need it.',
      'contact.phone': 'Phone', 'contact.email': 'Email', 'contact.address': 'Address', 'contact.addressVal': 'Ankara, Türkiye',
      'form.firstName': 'First name', 'form.lastName': 'Last name', 'form.email': 'Email', 'form.phone': 'Phone', 'form.requiredNote': 'fields marked are required',
      'form.company': 'Company', 'form.interest': 'Solutions of interest', 'form.message': 'Your message', 'form.submit': 'Send',
      'svc.ag-og': 'MV/LV Design', 'svc.otomasyon': 'Grid Protection & Automation', 'svc.ges': 'Renewable Energy', 'svc.bess': 'Energy Storage', 'svc.emobility': 'E-Mobility',
      'footer.about': 'Engineering-led, end-to-end solution provider in energy infrastructure and power systems. Your trusted partner since 2000.',
      'footer.solutions': 'Solutions', 'footer.corporate': 'Company', 'footer.contact': 'Contact',
      'footer.kvkk': 'Privacy Notice', 'footer.cookie': 'Cookie Policy', 'footer.rights': '© 2026 Form Elektrik — All rights reserved.',
      'doc.kvkk-politikasi': 'General PDPL Policy', 'doc.basvuru-formu': 'Application Form',
      'doc.calisan-adayi': 'Candidate Applicant Notice', 'doc.imha-politikasi': 'Retention & Destruction Policy',
      'common.loading': 'Loading…', 'common.close': 'Close', 'common.more': 'Learn more',
      'appt.title': 'Book a Meeting', 'appt.calSub': 'Pick an available date.',
      'appt.quick': 'Online Meeting', 'appt.quickSub': 'Free 30-minute meeting',
      'appt.other': 'Other', 'appt.topicTitle': 'What would you like to discuss?',
      'appt.topicPh': 'Briefly describe the topic…', 'appt.continue': 'Continue', 'appt.topicLabel': 'Topic',
      'appt.topicsTitle': 'Topics you would like to discuss',
      'appt.productTitle': 'Choose a service', 'appt.slotTitle': 'Choose a time', 'appt.formTitle': 'Your details',
      'appt.back': 'Back', 'appt.confirm': 'Confirm Appointment',
      'appt.doneTitle': 'Request received!', 'appt.doneSub': 'Your appointment request has been created. We will confirm it by email.',
      'appt.noSlots': 'No times left on this date.',
      'msg.leadOk': 'Your request has been received! We will get back to you shortly.',
      'msg.leadErr': 'An error occurred. Please try again.',
      'msg.pickService': 'Please select at least one solution.',
      'ann.eyebrow': 'Announcements', 'ann.title': 'Latest Updates', 'ann.lead': 'New services, technical announcements and important developments.', 'ann.all': 'All Announcements', 'ann.readMore': 'Read more',
      'msg.kvkk': 'You must accept the Privacy Notice to proceed.',
      'kvkk.checkboxLabel': 'I have read and accept the Privacy Notice.',
      'kvkk.open': 'Open notice and accept', 'kvkk.accept': 'I have read and accept', 'kvkk.scrollHint': 'Scroll to the bottom of the notice to accept.',
      'cookie.text': 'This site uses cookies to improve your experience. See our <a href="/cerez-politikasi" target="_blank" rel="noopener">Cookie Policy</a> for details.',
      'cookie.accept': 'Accept',
      'cookie.reject': 'Decline',
      'blog.empty': 'No published posts yet.',
      'projects.empty': 'We will share our reference projects here soon.',
      'brands.visit': 'Visit site',
    },
  };

  // Hizmet kart fallback açıklamaları (API boşsa)
  const SVC_DESC = {
    tr: {
      'ag-og': 'Alçak ve orta gerilim elektrik tesisleri için anahtar teslim projelendirme, taahhüt ve devreye alma hizmetleri.',
      'otomasyon': 'OG şebekeleri için koruma, kontrol ve otomasyon. Akıllı şebeke uyumlu çözümler — Noja Power, Thytronic, Horstmann, Smilics.',
      'ges': 'Yüksek performanslı inverter teknolojileri ve akıllı güç yönetimiyle güneş enerjisi sistemleri — Growatt, Impetus Solar.',
      'bess': 'Yüksek performanslı batarya sistemleri ve akıllı güç yönetimi. Li3 entegratör yetkinliğiyle şebeke bağımsızlığı ve gider optimizasyonu.',
      'emobility': 'Sürdürülebilir ulaşım için elektrikli araç şarj altyapısı. EPSIS markasıyla şarj ağı işletmeciliği.',
    },
    en: {
      'ag-og': 'Turnkey design, contracting and commissioning for low- and medium-voltage electrical installations.',
      'otomasyon': 'Protection, control and automation for MV grids. Smart-grid compatible — Noja Power, Thytronic, Horstmann, Smilics.',
      'ges': 'Solar energy systems with high-performance inverters and smart power management — Growatt, Impetus Solar.',
      'bess': 'High-performance battery systems and smart power management. Grid independence and cost optimisation with Li3 integration expertise.',
      'emobility': 'EV charging infrastructure for sustainable mobility. Charging network operation under the EPSIS brand.',
    },
  };
  const SVC_ICON = { 'ag-og': 'bolt', 'otomasyon': 'settings_input_component', 'ges': 'solar_power', 'bess': 'battery_charging_full', 'emobility': 'ev_station' };
  const SVC_IMAGE = { 'ag-og': '/assets/services/ag-og.jpg', 'otomasyon': '/assets/services/otomasyon.jpg', 'ges': '/assets/services/ges.jpg', 'bess': '/assets/services/bess.jpg', 'emobility': '/assets/services/emobility.jpg' };
  const SVC_ORDER = ['ag-og', 'otomasyon', 'ges', 'bess', 'emobility'];
  const serviceIconName = (value, code) => String(value || SVC_ICON[code] || 'bolt').trim() || 'bolt';

  let LANG = localStorage.getItem('fe-lang') || 'tr';
  if (!I18N[LANG]) LANG = 'tr';
  const t = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.tr[k] || k;

  function applyLang() {
    document.documentElement.lang = LANG;
    $$('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      const val = t(k);
      // sadece kendi metnini çevir; iç içe span'ları olanları atla (zaten kendi data-i18n'leri var)
      if (val && !el.querySelector('[data-i18n]')) el.textContent = val;
    });
    $$('[data-i18n-placeholder]').forEach(el => {
      const val = t(el.getAttribute('data-i18n-placeholder'));
      if (val) el.setAttribute('placeholder', val);
    });
    $$('#langToggle button').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
  }

  function bindLang() {
    $$('#langToggle button').forEach(b => b.addEventListener('click', () => {
      LANG = b.dataset.lang; localStorage.setItem('fe-lang', LANG);
      applyLang(); loadServices(); loadBrands(); loadBlog(); loadAnnouncements();
      window.dispatchEvent(new Event('fe-lang-change'));
    }));
  }

  /* ===== Header / mobil menü ===== */
  function bindHeader() {
    const header = $('#siteHeader');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const menuToggle = $('#menuToggle'); const mobileNav = $('#mobileNav');
    const closeMobile = () => { mobileNav.classList.remove('open'); document.body.style.overflow = ''; };
    menuToggle.addEventListener('click', () => { const o = mobileNav.classList.toggle('open'); document.body.style.overflow = o ? 'hidden' : ''; });
    $$('#mobileNav a').forEach(a => a.addEventListener('click', closeMobile));
  }

  /* ===== Aktif menü vurgusu (bulunulan sayfaya göre) ===== */
  function markActiveNav() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    // path öneki → o menü grubunu vurgula
    const groups = [
      { test: (p) => p === '/hakkimizda' || p.startsWith('/kariyer'), match: '/hakkimizda' },
      { test: (p) => p === '/blog' || p.startsWith('/post'), match: '/blog' },
      { test: (p) => p.startsWith('/projeler') || p.startsWith('/proje'), match: '#projeler' },
      { test: (p) => p.startsWith('/hizmet'), match: '#hizmetler' },
    ];
    const active = groups.find(g => g.test(path));
    const links = $$('.nav-links a, .mobile-nav a');
    const clearAll = () => links.forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
    const markMatch = (m) => { clearAll(); links.forEach(a => { const href = a.getAttribute('href') || ''; if (href === m || href.endsWith(m)) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); } }); };

    if (active) { markMatch(active.match); return; }

    // Ana sayfa: kaydırmaya göre dinamik vurgula (scroll-spy)
    if (path === '/' || path === '') initScrollSpy(links, markMatch, clearAll);
  }

  // Ana sayfa bölümlerini izleyip görünen bölümün menü öğesini aktif eder
  function initScrollSpy(links, markMatch, clearAll) {
    // Menüdeki hash hedeflerini (#hizmetler, #projeler, ...) topla
    const hashes = [...new Set(links.map(a => (a.getAttribute('href') || '').replace(/^.*#/, '#')).filter(h => h.startsWith('#') && h.length > 1))];
    const sections = hashes.map(h => document.querySelector(h)).filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const visible = new Map(); // section -> intersectionRatio
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) visible.set(e.target, e.intersectionRatio); else visible.delete(e.target); });
      // En çok görünen bölümü seç
      let best = null, bestRatio = 0;
      visible.forEach((r, sec) => { if (r > bestRatio) { bestRatio = r; best = sec; } });
      if (best && best.id) markMatch('#' + best.id);
      else if (window.scrollY < 80) clearAll(); // en üstte hiçbiri
    }, { threshold: [0.15, 0.4, 0.7], rootMargin: `-${(window.innerWidth >= 980 ? 84 : 64)}px 0px -40% 0px` });
    sections.forEach(s => io.observe(s));
  }

  /* ===== Scroll reveal ===== */
  function bindReveal() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  /* ===== Parallax arka plan ===== */
  function bindParallaxBg() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = (x, y) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.body.style.setProperty('--px', x + 'px');
        document.body.style.setProperty('--py', y + 'px');
        document.body.style.setProperty('--scrollY', window.scrollY + 'px');
        raf = 0;
      });
    };
    window.addEventListener('mousemove', e => {
      update((e.clientX / window.innerWidth - 0.5) * 26, (e.clientY / window.innerHeight - 0.5) * 26);
    }, { passive: true });
    window.addEventListener('scroll', () => update(0, 0), { passive: true });
  }

  /* ===== Count-up ===== */
  function bindCountUp() {
    const fmt = (n) => n >= 1000 ? n.toLocaleString('tr-TR') : String(n);
    const run = (el) => {
      const target = Number(el.dataset.count || 0); const suffix = el.dataset.suffix || '';
      const dur = 1400; const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur); const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { $$('[data-count]').forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(el => io.observe(el));
  }

  async function getJSON(url) {
    try { const r = await fetch(url); if (!r.ok) return null; return await r.json(); }
    catch { return null; }
  }

  /* ===== Hizmetler ===== */
  async function loadServices() {
    const grid = $('#servicesGrid'); if (!grid) return;
    const data = await getJSON('/api/services?language=' + LANG);
    let list = (data && data.services) || [];
    if (!list.length) {
      list = SVC_ORDER.map(code => ({ slug: code, code, title: t('svc.' + code), summary: SVC_DESC[LANG][code], icon: SVC_ICON[code], _static: true }));
    }
    const cards = list.map((s, index) => {
      const code = s.code || s.slug;
      const href = s._static ? '#iletisim' : `/hizmet?slug=${encodeURIComponent(s.slug)}`;
      const img = s.image_url || s.cover_image || SVC_IMAGE[code] || '';
      const icon = serviceIconName(s.icon, code);
      return { ...s, code, href, img, icon, index };
    });
    grid.innerHTML = `<div class="solutions-grid reveal">
      ${cards.map(s => `
        <div class="solution-wrap">
          <a class="solution-card" href="${s.href}">
            <div class="solution-media">
              ${s.img ? `<img src="${esc(s.img)}" alt="${esc(s.title)}" loading="lazy" onerror="this.parentElement.classList.add('no-img');this.remove()">` : ''}
              <span class="solution-ico"><span class="material-symbols-rounded">${esc(s.icon)}</span></span>
            </div>
            <div class="solution-body">
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.summary || '')}</p>
              <span class="solution-more">${esc(t('common.more'))} <span class="material-symbols-rounded">arrow_forward</span></span>
            </div>
            <div class="solution-brands-marquee" id="svcBrands-${esc(s.code)}"></div>
          </a>
        </div>`).join('')}
    </div>`;
    bindReveal();
    cards.forEach(s => loadSolutionBrands(s.code));
  }

  async function loadSolutionBrands(code) {
    const wrap = $(`#svcBrands-${code}`); if (!wrap) return;
    const data = await getJSON('/api/brands/partner?service=' + encodeURIComponent(code));
    const list = (data && data.brands) || [];
    if (!list.length) { wrap.remove(); return; }
    // İçeriği 3x tekrarla — sonsuz kayma efekti
    const items = list.map(b =>
      `<a class="vmarquee-item" href="/marka?slug=${encodeURIComponent(b.slug)}" onclick="event.preventDefault();event.stopPropagation();location.href=this.href" title="${esc(b.name)}">
        ${b.logo_url ? `<img src="${esc(b.logo_url)}" alt="${esc(b.name)}" loading="lazy" />` : `<span class="vmarquee-text">${esc(b.name)}</span>`}
      </a>`
    ).join('');
    const repeated = items + items + items;
    wrap.innerHTML = `<div class="vmarquee-track">${repeated}</div>`;
    // Hover ile durdur
    const track = wrap.querySelector('.vmarquee-track');
    wrap.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    wrap.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }

  /* ===== Markalar — 4 çözüm grubunda dikey kayan slot ===== */
  const SVC_LABELS = { otomasyon: 'Şebeke Koruma ve Otomasyon', ges: 'Yenilenebilir Enerji (GES)', bess: 'Enerji Depolama (BESS)', emobility: 'E-Mobilite' };

  async function loadBrands() {
    const grid = $('#brandsGrid'); if (!grid) return;
    const groups = SVC_ORDER;
    const fetches = groups.map(code => getJSON('/api/brands/partner?service=' + encodeURIComponent(code)));
    const results = await Promise.all(fetches);
    const slots = groups.map((code, i) => ({ code, brands: (results[i] && results[i].brands) || [] })).filter(s => s.brands.length);
    if (!slots.length) { const sec = grid.closest('section'); if (sec) sec.style.display = 'none'; return; }
    const sec = grid.closest('section'); if (sec) sec.style.display = '';
    grid.innerHTML = `<div class="brand-slots reveal">${slots.map(s => {
      const items = s.brands.map(b =>
        `<a class="bslot-item" href="/marka?slug=${encodeURIComponent(b.slug)}">
          <div class="bslot-logo">${b.logo_url ? `<img src="${esc(b.logo_url)}" alt="${esc(b.name)}" loading="lazy" />` : `<span class="bslot-name">${esc(b.name)}</span>`}</div>
          ${b.description ? `<p class="bslot-desc">${esc(b.description)}</p>` : ''}
        </a>`
      ).join('');
      return `<div class="bslot">
        <h3 class="bslot-title">${esc(SVC_LABELS[s.code] || s.code)}</h3>
        <div class="bslot-viewport">
          <button type="button" class="bslot-nav bslot-nav-up" aria-label="Yukarı"><span class="material-symbols-rounded">keyboard_arrow_up</span></button>
          <div class="bslot-track">${items}</div>
          <button type="button" class="bslot-nav bslot-nav-down" aria-label="Aşağı"><span class="material-symbols-rounded">keyboard_arrow_down</span></button>
        </div>
      </div>`;
    }).join('')}</div>`;
    bindReveal();
    grid.querySelectorAll('.bslot-viewport').forEach(vp => {
      const track = vp.querySelector('.bslot-track');
      const items = track.querySelectorAll('.bslot-item');
      const count = items.length;
      if (count < 2) { vp.querySelectorAll('.bslot-nav').forEach(b => b.style.display = 'none'); return; }
      let idx = 0, autoTimer;
      const itemH = () => items[0].offsetHeight + 16;
      const go = (i) => { idx = ((i % count) + count) % count; track.style.transform = `translateY(-${idx * itemH()}px)`; };
      vp.querySelector('.bslot-nav-up').onclick = () => { go(idx - 1); resetAuto(); };
      vp.querySelector('.bslot-nav-down').onclick = () => { go(idx + 1); resetAuto(); };
      const startAuto = () => { autoTimer = setInterval(() => go(idx + 1), 4000); };
      const resetAuto = () => { clearInterval(autoTimer); startAuto(); };
      vp.addEventListener('mouseenter', () => clearInterval(autoTimer));
      vp.addEventListener('mouseleave', () => startAuto());
      startAuto();
    });
  }

  /* ===== Video URL'leri (admin'den yönetilen) ===== */
  async function loadVideoUrls() {
    const data = await getJSON('/api/settings/public/videos');
    if (!data) return;
    function setVideoSrc(el, url) {
      if (!el || !url) return;
      const src = el.querySelector('source');
      if (src && src.getAttribute('src') !== url) { src.src = url; el.load(); }
    }
    setVideoSrc($('#heroVideo'), data.hero_video_url);
    setVideoSrc($('#introVideo'), data.intro_video_url);
  }

  /* ===== Blog ===== */
  async function loadBlog() {
    const grid = $('#blogGrid'); if (!grid) return;
    const data = await getJSON('/api/posts?language=' + LANG + '&limit=3');
    const list = (data && data.posts) || [];
    if (!list.length) { grid.innerHTML = `<div class="blog-empty">${esc(t('blog.empty'))}</div>`; return; }
    const fmtDate = (d) => { if (!d) return ''; try { return new Date(d).toLocaleDateString(LANG === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
    grid.innerHTML = list.map(p => {
      const tags = (p.tags || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 2);
      return `<a class="post-card reveal" href="/post?slug=${encodeURIComponent(p.slug)}">
        <div class="post-thumb">${p.cover_image ? `<img src="${esc(p.cover_image)}" alt="${esc(p.title)}" loading="lazy" />` : ''}</div>
        <div class="post-body">
          <h3>${esc(p.title)}</h3>
          ${tags.length ? `<div class="post-tags">${tags.map(tg => `<span class="post-tag">${esc(tg)}</span>`).join('')}</div>` : ''}
          <p>${esc(p.excerpt || '')}</p>
          <span class="post-date"><span class="material-symbols-rounded">schedule</span>${fmtDate(p.published_at)}</span>
        </div>
      </a>`;
    }).join('');
    bindReveal();
  }

  /* ===== Duyurular (ana sayfa slider) ===== */
  const SLIDER_THRESHOLD = 3; // bu sayıdan FAZLA duyuru varsa slider modu

  async function loadAnnouncements() {
    const section = $('#duyurular');
    const track = $('#announcementsTrack');
    if (!section || !track) return;
    const data = await getJSON('/api/announcements?language=' + LANG + '&limit=12');
    const list = (data && data.announcements) || [];
    if (!list.length) { section.style.display = 'none'; return; }
    section.style.display = '';

    const fmtDate = (d) => { if (!d) return ''; try { return new Date(d).toLocaleDateString(LANG === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
    track.innerHTML = list.map((a, i) => {
      const cover = a.cover_image
        ? `<div class="announcement-cover"><img src="${esc(a.cover_image)}" alt="${esc(a.title)}" loading="lazy" onerror="this.parentElement.remove()"></div>`
        : '';
      // Ayrı sayfaya gitme — tıklayınca popup aç (data-ann-index)
      return `<button type="button" class="announcement-card" data-ann-index="${i}">
        ${cover}
        <div class="announcement-card-body">
          <span class="announcement-date">${esc(fmtDate(a.published_at))}</span>
          <h3>${esc(a.title)}</h3>
          <p>${esc(a.excerpt || '')}</p>
          <span class="announcement-more">${esc(t('ann.readMore'))} <span class="material-symbols-rounded">arrow_forward</span></span>
        </div>
      </button>`;
    }).join('');

    const slider = section.querySelector('.announcement-slider');
    const prevBtn = section.querySelector('.ann-prev');
    const nextBtn = section.querySelector('.ann-next');
    const dotsWrap = $('#announcementsDots');
    const cards = Array.from(track.children);

    // Kart tıklayınca duyuru popup'ını aç (ayrı sayfaya gitmez)
    cards.forEach(c => c.addEventListener('click', () => {
      const idx = Number(c.dataset.annIndex);
      if (!isNaN(idx) && list[idx]) showAnnouncementModal(list[idx]);
    }));

    // SLIDER yalnızca eşik üstünde; aksi halde ortalı sabit dizilim
    const sliderMode = list.length > SLIDER_THRESHOLD;
    slider.classList.toggle('is-slider', sliderMode);
    slider.classList.toggle('is-static', !sliderMode);

    if (!sliderMode) {
      // Ortalı statik mod: oklar ve noktalar gizli
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (dotsWrap) dotsWrap.innerHTML = '';
      bindReveal();
      return;
    }

    // ---- Slider modu ----
    const scrollByCard = (dir) => {
      const card = cards[0];
      const step = card ? card.offsetWidth + 20 : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * step, behavior: 'smooth' });
    };
    const updateControls = () => {
      const overflow = track.scrollWidth - track.clientWidth > 8;
      if (prevBtn) prevBtn.hidden = !overflow;
      if (nextBtn) nextBtn.hidden = !overflow;
      if (dotsWrap && cards.length) {
        const idx = Math.round(track.scrollLeft / (cards[0].offsetWidth + 20));
        dotsWrap.querySelectorAll('.ann-dot').forEach((d, i) => d.classList.toggle('is-active', i === idx));
      }
    };
    if (prevBtn) prevBtn.onclick = () => scrollByCard(-1);
    if (nextBtn) nextBtn.onclick = () => scrollByCard(1);
    if (dotsWrap) {
      dotsWrap.innerHTML = cards.map((_, i) => `<button type="button" class="ann-dot${i === 0 ? ' is-active' : ''}" aria-label="${i + 1}"></button>`).join('');
      dotsWrap.querySelectorAll('.ann-dot').forEach((d, i) => d.onclick = () => {
        const card = cards[i];
        if (card) track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
      });
    }
    track.addEventListener('scroll', () => { window.requestAnimationFrame(updateControls); }, { passive: true });
    window.addEventListener('resize', updateControls);
    updateControls();
    bindReveal();
  }

  /* ===== Duyuru detay modalı (kart tıklayınca / sayfa açılınca) ===== */
  async function showAnnouncementModal(a) {
    const overlay = $('#annPopup'); if (!overlay || !a) return;
    const titleEl = $('#annPopupTitle'); if (titleEl) titleEl.textContent = a.title;
    const cover = $('#annPopupCover');
    if (cover) {
      if (a.cover_image) {
        const img = cover.querySelector('img');
        img.src = a.cover_image; img.alt = a.title;
        img.onerror = () => { cover.hidden = true; };
        cover.hidden = false;
      } else cover.hidden = true;
    }
    const bodyEl = $('#annPopupBody');
    if (bodyEl) {
      // Tam içerik (body) — liste API'si body döndürmediği için slug ile çek. Detay sayfası YOK.
      bodyEl.innerHTML = a.excerpt ? `<p>${esc(a.excerpt)}</p>` : '';
      if (a.body !== undefined) {
        renderAnnBody(bodyEl, a);
      } else {
        getJSON('/api/announcements/' + encodeURIComponent(a.slug)).then(d => {
          if (d && d.announcement) renderAnnBody(bodyEl, d.announcement);
        });
      }
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderAnnBody(bodyEl, a) {
    if (a.body && a.body.trim()) {
      const looksHtml = /<[a-z][\s\S]*>/i.test(a.body);
      bodyEl.innerHTML = looksHtml ? a.body : esc(a.body).replace(/\n/g, '<br>');
    } else if (a.excerpt) {
      bodyEl.innerHTML = `<p>${esc(a.excerpt)}</p>`;
    } else bodyEl.textContent = '';
  }

  function bindAnnouncementModalClose() {
    const overlay = $('#annPopup'); if (!overlay) return;
    const close = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; };
    const closeBtn = $('#annPopupClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
    return close;
  }

  /* ===== Duyuru popup'ı (sayfa açılınca, gün başına bir kez) ===== */
  async function initAnnouncementPopup() {
    const overlay = $('#annPopup'); if (!overlay) return;
    // Modal kapatma davranışını bir kez bağla (hem kart hem otomatik popup için)
    bindAnnouncementModalClose();

    const data = await getJSON('/api/announcements/popup?language=' + LANG);
    const a = data && data.announcement;
    if (!a) return;

    // Gün başına bir kez: bu duyuru bugün kapatıldıysa otomatik açma
    const today = new Date().toISOString().slice(0, 10);
    const seenKey = `fe-ann-popup-${a.slug}-${today}`;
    try { if (localStorage.getItem(seenKey)) return; } catch {}

    // Kapatınca/dışarı tıklayınca bugün tekrar açılmasın
    const markSeen = () => { try { localStorage.setItem(seenKey, '1'); } catch {} };
    $('#annPopupClose') && $('#annPopupClose').addEventListener('click', markSeen);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) markSeen(); });

    // Kısa gecikmeyle aç (sayfa otursun)
    setTimeout(() => showAnnouncementModal(a), 800);
  }

  /* ===== Partner markalar ===== */
  function loadPartners() {
    const track = $('#partnerTrack'); if (!track) return;
    const partners = [
      { name: 'Thytronic', logo: '/assets/brands/thytronic.avif' },
      { name: 'Noja Power', logo: '/assets/brands/noja-power.avif' },
      { name: 'Horstmann', logo: '/assets/brands/horstmann.avif' },
      { name: 'Smilics', logo: '/assets/brands/smilics.avif' },
    ];
    const item = (p) => {
      const cls = String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<span class="partner-logo-box partner-${esc(cls)}"><img src="${esc(p.logo)}" alt="${esc(p.name)}" loading="lazy" onerror="this.closest('.partner-logo-box').remove()" /></span>`;
    };
    const strip = partners.map(item).join('');
    track.innerHTML = strip.repeat(6);
  }

  /* ===== Referans logoları ===== */
  async function loadRefs() {
    const track = $('#refTrack'); if (!track) return;
    const data = await getJSON('/api/references');
    const logos = (data && data.logos) || [];
    if (!logos.length) { track.closest('.logos-band').style.display = 'none'; return; }
    const make = (set) => set.map(l => `<img src="${esc(l.logo_url)}" alt="${esc(l.name)}" loading="lazy" onerror="this.remove()" />`).join('');
    const mid = Math.ceil(logos.length / 2);
    const rowA = logos.slice(0, mid);
    const rowB = logos.slice(mid);
    track.classList.add('marquee-track-rows');
    track.innerHTML = `<div class="marquee-row marquee-row-a">${make(rowA).repeat(3)}</div><div class="marquee-row marquee-row-b">${make(rowB).repeat(3)}</div>`;
  }

  /* ===== İletişim bilgileri (admin ayarları) ===== */
  async function loadContact() {
    const data = await getJSON('/api/settings/public/contact');
    if (!data) return;
    if (data.phone) {
      const p = $('#ciPhone'); if (p) p.textContent = data.phone;
      const fp = $('#footerPhone'); if (fp) fp.textContent = data.phone;
    }
    if (data.email) {
      const e = $('#ciEmail'); if (e) e.textContent = data.email;
      const fe = $('#footerEmail'); if (fe) fe.textContent = data.email;
    }
    if (data.address) { const a = $('#ciAddress'); if (a) a.textContent = data.address; }
    if (data.hours) { const h = $('#ciHours'); if (h) h.textContent = data.hours; }
    // Harita: src'yi hesapla, modal açılınca yükle (lazy)
    if (data.maps_lat && data.maps_lng && !isNaN(+data.maps_lat) && !isNaN(+data.maps_lng)) {
      const la = +data.maps_lat, lo = +data.maps_lng, d = 0.012;
      window._mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lo - d}%2C${la - d}%2C${lo + d}%2C${la + d}&layer=mapnik&marker=${la}%2C${lo}`;
    } else if (data.maps_embed_url) {
      window._mapSrc = data.maps_embed_url;
    }
    // Sosyal linkler — contact + footer (data-social attribute ile). Boşsa gizle.
    ['linkedin', 'instagram', 'youtube', 'facebook'].forEach(net => {
      const url = data['social_' + net];
      $$(`[data-social="${net}"]`).forEach(a => {
        if (url) a.href = url;
        else a.style.display = 'none';
      });
    });
  }

  /* ===== Harita Modal ===== */
  (function initMapModal() {
    const overlay = $('#mapModal');
    const iframe = $('#contactMapIframe');
    const openBtn = $('#openMapBtn');
    const closeBtn = $('#closeMapBtn');
    if (!overlay) return;
    function open() {
      if (iframe && iframe.src === 'about:blank' && window._mapSrc) iframe.src = window._mapSrc;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
  })();

  /* ===== KVKK / belge onay checkbox'ı (popup + sona kaydırma zorunlu) =====
     docSlug ile bağlama göre farklı belge gösterilir:
       'kvkk'          → İletişim/Randevu formlarında KVKK Aydınlatma Metni
       'calisan-adayi' → Kariyer başvurusunda Çalışan Adayı Aydınlatma ve Açık Rıza Metni
  */
  // Belge slug → public sayfa yolu ve API ucu.
  function docEndpoint(slug) {
    return slug === 'kvkk'
      ? '/api/settings/public/kvkk?language=' + LANG
      : '/api/settings/public/belge/' + encodeURIComponent(slug) + '?language=' + LANG;
  }
  function docPageHref(slug) {
    return slug === 'kvkk' ? '/kvkk' : '/belge?slug=' + encodeURIComponent(slug);
  }
  async function getConsentContent(slug) {
    const data = await getJSON(docEndpoint(slug));
    const doc = data && (data.kvkk || data.doc);
    return doc || {
      title: LANG === 'en' ? 'Privacy Notice' : 'KVKK Aydınlatma Metni',
      body: `<p>${esc(t('msg.kvkk'))}</p>`,
      updated: '',
    };
  }

  function openKvkkConsent(checkbox, docSlug) {
    if (!checkbox) return;
    const slug = docSlug || 'kvkk';
    const fallbackTitle = LANG === 'en' ? 'Privacy Notice' : 'KVKK Aydınlatma Metni';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay kvkk-consent-overlay open';
    overlay.innerHTML = `
      <div class="modal kvkk-consent-modal" role="dialog" aria-modal="true" aria-labelledby="kvkkConsentTitle">
        <button type="button" class="modal-close" data-kvkk-close aria-label="Kapat"><span class="material-symbols-rounded">close</span></button>
        <h3 id="kvkkConsentTitle">${esc(fallbackTitle)}</h3>
        <p class="modal-sub">${esc(t('kvkk.scrollHint'))}</p>
        <div class="kvkk-consent-body"><div class="post-loading">${esc(t('common.loading'))}</div></div>
        <div class="kvkk-consent-actions">
          <a href="${docPageHref(slug)}" target="_blank" rel="noopener">${esc(t('kvkk.open'))}</a>
          <button type="button" class="btn btn-primary" data-kvkk-accept disabled>${esc(t('kvkk.accept'))}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const body = overlay.querySelector('.kvkk-consent-body');
    const accept = overlay.querySelector('[data-kvkk-accept]');
    const close = () => { overlay.remove(); document.body.style.overflow = ''; };
    const unlockIfBottom = () => {
      const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 12;
      if (atBottom) accept.disabled = false;
    };

    overlay.querySelector('[data-kvkk-close]').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    accept.addEventListener('click', () => {
      checkbox.dataset.kvkkAccepted = '1';
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    });
    body.addEventListener('scroll', unlockIfBottom, { passive: true });

    getConsentContent(slug).then(doc => {
      overlay.querySelector('#kvkkConsentTitle').textContent = doc.title || fallbackTitle;
      body.innerHTML = doc.body || '';
      requestAnimationFrame(() => {
        if (body.scrollHeight <= body.clientHeight + 12) accept.disabled = false;
      });
    }).catch(() => {
      body.innerHTML = `<p>${esc(t('msg.kvkk'))}</p>`;
      accept.disabled = false;
    });
  }

  // form: hedef form, id: checkbox id, opts: { docSlug, label } (bağlam belgesi)
  function injectKvkkCheckbox(form, id, opts) {
    if (!form || form.querySelector('#' + id)) return; // idempotent
    const submitBtn = form.querySelector('button[type=submit]');
    if (!submitBtn) return;
    const docSlug = (opts && opts.docSlug) || 'kvkk';
    const label = (opts && opts.label) || t('kvkk.checkboxLabel');
    const wrap = document.createElement('label');
    wrap.className = 'kvkk-check';
    wrap.innerHTML = `<input type="checkbox" id="${id}" readonly><span>${label} <button type="button" class="kvkk-open-link">${t('kvkk.open')}</button></span>`;
    const checkbox = wrap.querySelector('input');
    const openBtn = wrap.querySelector('.kvkk-open-link');
    checkbox.addEventListener('click', e => {
      if (checkbox.dataset.kvkkAccepted !== '1') {
        e.preventDefault();
        checkbox.checked = false;
        openKvkkConsent(checkbox, docSlug);
      }
    });
    openBtn.addEventListener('click', e => {
      e.preventDefault();
      openKvkkConsent(checkbox, docSlug);
    });
    submitBtn.before(wrap);
  }

  /* ===== İlgilenilen konu chip'leri — Randevu Konuları'ndan dinamik ===== */
  async function loadServiceChips() {
    const wrap = $('#serviceChips'); if (!wrap) return;
    const data = await getJSON('/api/appointments/topics');
    const topics = (data && data.topics) || [];
    if (!topics.length) return; // konu yoksa statik fallback HTML'i kalsın
    wrap.innerHTML = topics.map(tp =>
      `<button type="button" class="chip" data-topic="${esc(tp.title)}">${esc(tp.title)}</button>`
    ).join('');
    $$('#serviceChips .chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('active')));
  }

  /* ===== Lead / İletişim formu (modal) ===== */
  function bindLeadForm() {
    const form = $('#leadForm'); if (!form) return;
    injectKvkkCheckbox(form, 'leadKvkk');
    loadServiceChips();
    // Statik fallback chip'lerini de bağla (topics yüklenemezse)
    $$('#serviceChips .chip').forEach(c => c.addEventListener('click', () => c.classList.toggle('active')));
    const msg = $('#leadMsg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); msg.className = 'form-msg'; msg.textContent = '';
      const kvkk = form.querySelector('#leadKvkk');
      if (kvkk && !kvkk.checked) { msg.className = 'form-msg err'; msg.textContent = t('msg.kvkk'); return; }
      const activeChips = $$('#serviceChips .chip').filter(c => c.classList.contains('active'));
      const products = activeChips.map(c => c.dataset.topic || c.dataset.code);
      if (!products.length) { msg.className = 'form-msg err'; msg.textContent = t('msg.pickService'); return; }
      const fd = new FormData(form);
      const payload = { firstName: fd.get('firstName'), lastName: fd.get('lastName'), email: fd.get('email'), phone: fd.get('phone'), company: fd.get('company'), message: fd.get('message'), products };
      try {
        const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error();
        msg.className = 'form-msg ok'; msg.textContent = t('msg.leadOk');
        form.reset(); $$('#serviceChips .chip').forEach(c => c.classList.remove('active'));
      } catch { msg.className = 'form-msg err'; msg.textContent = t('msg.leadErr'); }
    });

    // İletişim modalı aç/kapat
    const modal = $('#contactModal');
    if (modal) {
      const open = () => { modal.classList.add('open'); document.body.style.overflow = 'hidden'; if (msg) { msg.className = 'form-msg'; msg.textContent = ''; } };
      const close = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };
      $$('[data-open-contact]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
      $$('[data-close-contact]').forEach(b => b.addEventListener('click', close));
      modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
    }
  }

  /* ===== Randevu modalı ===== */
  function bindAppointment() {
    const modal = $('#appointmentModal'); if (!modal) return;
    // Ürün/konu artık randevu konusu BAŞLIĞI (serbest metin). Başlık hem değer hem etiket.
    const labelFor = (code) => code === 'other' ? t('appt.other') : (code || '');
    let availableDates = []; let viewYear, viewMonth;
    let sel = { date: null, product: null, slotId: null, time: null, topic: null, topics: [], other: false };
    const steps = { calendar: $('#apptStepCalendar'), product: $('#apptStepProduct'), slot: $('#apptStepSlot'), form: $('#apptStepForm'), done: $('#apptStepDone') };
    const show = (name) => Object.entries(steps).forEach(([k, el]) => el.classList.toggle('active', k === name));

    const open = async () => {
      sel = { date: null, product: null, slotId: null, time: null, topic: null, topics: [], other: false };
      modal.classList.add('open'); document.body.style.overflow = 'hidden'; show('calendar');
      const data = await getJSON('/api/appointments/dates');
      availableDates = (data && data.dates) || [];
      const today = new Date(); viewYear = today.getFullYear(); viewMonth = today.getMonth();
      if (availableDates.length) { const d = new Date(availableDates[0] + 'T00:00:00'); viewYear = d.getFullYear(); viewMonth = d.getMonth(); }
      renderCalendar();
    };
    const close = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };

    function renderCalendar() {
      const label = $('#calMonthLabel'); const grid = $('#calGrid');
      const m = LANG === 'tr' ? ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'] : ['January','February','March','April','May','June','July','August','September','October','November','December'];
      label.textContent = `${m[viewMonth]} ${viewYear}`;
      const dows = LANG === 'tr' ? ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'] : ['Mo','Tu','We','Th','Fr','Sa','Su'];
      let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');
      const first = new Date(viewYear, viewMonth, 1); let sd = first.getDay(); sd = sd === 0 ? 6 : sd - 1;
      const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
      for (let i = 0; i < sd; i++) html += `<div class="cal-day empty"></div>`;
      const todayStr = new Date().toISOString().slice(0, 10);
      for (let d = 1; d <= dim; d++) {
        const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const avail = availableDates.includes(ds); const past = ds < todayStr;
        const cls = avail ? 'available' : (past ? 'disabled' : '');
        html += `<div class="cal-day ${cls}" ${avail ? `data-date="${ds}"` : ''}>${d}</div>`;
      }
      grid.innerHTML = html;
      $$('#calGrid .cal-day.available').forEach(el => el.addEventListener('click', () => selectDate(el.dataset.date)));
    }
    function fmtDateLong(d) { try { return new Date(d + 'T00:00:00').toLocaleDateString(LANG === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }); } catch { return d; } }

    async function selectDate(date) {
      sel.date = date; $('#apptProductSub').textContent = fmtDateLong(date);
      const data = await getJSON('/api/appointments/products?date=' + date);
      const products = (data && data.products) || []; const box = $('#apptProducts');
      if (!products.length) box.innerHTML = `<div class="appt-empty">${esc(t('appt.noSlots'))}</div>`;
      else { box.innerHTML = products.map(c => `<button class="appt-opt" data-product="${esc(c)}">${esc(c)}</button>`).join('') + `<button class="appt-opt" data-product="other">${esc(t('appt.other'))}</button>`; $$('#apptProducts .appt-opt').forEach(b => b.addEventListener('click', () => selectProduct(b.dataset.product))); }
      show('product');
    }
    async function selectProduct(code) {
      sel.product = code; sel.topic = null; $('#apptSlotSub').textContent = `${fmtDateLong(sel.date)} · ${labelFor(code)}`;
      const data = await getJSON(`/api/appointments/slots?date=${sel.date}&product=${encodeURIComponent(code)}`);
      const slots = (data && data.slots) || []; const box = $('#apptSlots');
      if (!slots.length) box.innerHTML = `<div class="appt-empty">${esc(t('appt.noSlots'))}</div>`;
      else { box.innerHTML = slots.map(s => `<button class="appt-slot-btn" data-id="${s.id}" data-time="${esc(s.slot_time)}">${esc(s.slot_time)}</button>`).join(''); $$('#apptSlots .appt-slot-btn').forEach(b => b.addEventListener('click', () => selectSlot(b.dataset.id, b.dataset.time))); }
      show('slot');
    }
    function selectSlot(id, time) { sel.slotId = id; sel.time = time; const lbl = (sel.topics && sel.topics.length) ? sel.topics.join(', ') : labelFor(sel.product); $('#apptFormSub').textContent = `${fmtDateLong(sel.date)} · ${time} · ${lbl}`; show('form'); }

    /* ===== Online Toplantı kartı (hero CTA) — aynı state/API, kart içi akış ===== */
    const qaCard = $('.cta-calendar-card');
    if (qaCard) {
      let qaDates = []; let qaYear, qaMonth;
      const qaSteps = { cal: $('#qaCalStep'), product: $('#qaProductStep'), slot: $('#qaSlotStep') };
      const showQuick = (name) => Object.entries(qaSteps).forEach(([k, el]) => el && el.classList.toggle('hidden', k !== name));

      const MONTHS = () => LANG === 'tr'
        ? ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
        : ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const DOWS = () => LANG === 'tr' ? ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'] : ['Mo','Tu','We','Th','Fr','Sa','Su'];

      function renderQuickCal() {
        const label = $('#qaCalLabel'); const grid = $('#qaCalGrid'); if (!grid) return;
        const m = MONTHS();
        label.textContent = `${m[qaMonth]} ${qaYear}`;
        let html = DOWS().map(d => `<span>${d}</span>`).join('');
        const first = new Date(qaYear, qaMonth, 1); let sd = first.getDay(); sd = sd === 0 ? 6 : sd - 1;
        const dim = new Date(qaYear, qaMonth + 1, 0).getDate();
        for (let i = 0; i < sd; i++) html += `<em class="qa-empty"></em>`;
        const todayStr = new Date().toISOString().slice(0, 10);
        for (let d = 1; d <= dim; d++) {
          const ds = `${qaYear}-${String(qaMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const avail = qaDates.includes(ds); const past = ds < todayStr;
          if (avail) html += `<button type="button" class="qa-avail" data-date="${ds}">${d}<i></i></button>`;
          else html += `<em class="${past ? 'qa-past' : ''}">${d}</em>`;
        }
        grid.innerHTML = html;
        $$('#qaCalGrid .qa-avail').forEach(el => el.addEventListener('click', () => quickSelectDate(el.dataset.date)));
      }

      async function quickSelectDate(date) {
        sel.date = date; sel.topics = []; sel.other = false;
        $('#qaProductSub').textContent = fmtDateLong(date);
        const data = await getJSON('/api/appointments/topics');
        const topics = (data && data.topics) || []; const box = $('#qaProducts');
        // Çoklu seçilebilir konu chip'leri + "Diğer" + serbest metin + Devam
        box.innerHTML =
          topics.map(tp => `<button type="button" class="qa-opt qa-topic-chip" data-title="${esc(tp.title)}">${esc(tp.title)}</button>`).join('')
          + `<button type="button" class="qa-opt qa-topic-chip qa-other-chip" data-other="1">${esc(t('appt.other'))}</button>`
          + `<textarea id="qaOtherText" class="qa-topic hidden" rows="2" maxlength="300" data-i18n-placeholder="appt.topicPh" placeholder="Kısaca konuyu yazın…"></textarea>`
          + `<button type="button" class="qa-opt qa-topic-next" id="qaTopicsNext">${esc(t('appt.continue'))}</button>`;
        $$('#qaProducts .qa-topic-chip').forEach(b => b.addEventListener('click', () => toggleQuickTopic(b)));
        $('#qaTopicsNext')?.addEventListener('click', quickTopicsNext);
        applyLang();
        showQuick('product');
      }

      function toggleQuickTopic(btn) {
        btn.classList.toggle('active');
        if (btn.dataset.other) {
          sel.other = btn.classList.contains('active');
          const ta = $('#qaOtherText'); if (ta) { ta.classList.toggle('hidden', !sel.other); if (sel.other) ta.focus(); }
        }
      }

      function quickTopicsNext() {
        const picked = $$('#qaProducts .qa-topic-chip.active:not(.qa-other-chip)').map(b => b.dataset.title);
        const otherTxt = sel.other ? ($('#qaOtherText')?.value || '').trim() : '';
        if (otherTxt) picked.push(otherTxt);
        if (!picked.length) { const n = $('#qaTopicsNext'); if (n) { n.classList.add('shake'); setTimeout(() => n.classList.remove('shake'), 400); } return; }
        sel.topics = picked;
        loadQuickSlots('');
      }

      async function loadQuickSlots(code) {
        const topicLbl = (sel.topics && sel.topics.length) ? sel.topics.join(', ') : labelFor(code);
        $('#qaSlotSub').textContent = `${fmtDateLong(sel.date)} · ${topicLbl}`;
        const data = await getJSON(`/api/appointments/slots?date=${sel.date}${code ? '&product=' + encodeURIComponent(code) : ''}`);
        const slots = (data && data.slots) || []; const box = $('#qaSlots');
        if (!slots.length) box.innerHTML = `<div class="qa-empty-msg">${esc(t('appt.noSlots'))}</div>`;
        else { box.innerHTML = slots.map(s => `<button type="button" class="qa-slot" data-id="${s.id}" data-time="${esc(s.slot_time)}">${esc(s.slot_time)}</button>`).join(''); $$('#qaSlots .qa-slot').forEach(b => b.addEventListener('click', () => quickSelectSlot(b.dataset.id, b.dataset.time))); }
        showQuick('slot');
      }

      // Saate tıklanınca: modaldaki form adımını aç (state'i selectSlot dolduruyor)
      function quickSelectSlot(id, time) {
        selectSlot(id, time);
        modal.classList.add('open'); document.body.style.overflow = 'hidden';
        // Kartı başa sıfırla ki modal kapanınca temiz görünsün
        showQuick('cal');
      }

      function loadQuickCal() {
        getJSON('/api/appointments/dates').then((data) => {
          qaDates = (data && data.dates) || [];
          const today = new Date(); qaYear = today.getFullYear(); qaMonth = today.getMonth();
          if (qaDates.length) { const d = new Date(qaDates[0] + 'T00:00:00'); qaYear = d.getFullYear(); qaMonth = d.getMonth(); }
          showQuick('cal'); renderQuickCal();
        });
      }

      $('#qaPrev')?.addEventListener('click', () => { qaMonth--; if (qaMonth < 0) { qaMonth = 11; qaYear--; } renderQuickCal(); });
      $('#qaNext')?.addEventListener('click', () => { qaMonth++; if (qaMonth > 11) { qaMonth = 0; qaYear++; } renderQuickCal(); });
      $$('[data-qa-back]').forEach(b => b.addEventListener('click', () => showQuick(b.dataset.qaBack)));

      loadQuickCal();
      // Dil değişiminde başlık/günleri yeniden çiz
      window.addEventListener('fe-lang-change', () => { if (qaYear != null) renderQuickCal(); });
    }

    const apptForm = $('#apptForm'); const apptMsg = $('#apptMsg');
    injectKvkkCheckbox(apptForm, 'apptKvkk');
    apptForm.addEventListener('submit', async (e) => {
      e.preventDefault(); apptMsg.className = 'form-msg';
      const apptKvkk = apptForm.querySelector('#apptKvkk');
      if (apptKvkk && !apptKvkk.checked) { apptMsg.className = 'form-msg err'; apptMsg.textContent = t('msg.kvkk'); return; }
      const fd = new FormData(apptForm);
      let notes = (fd.get('notes') || '').toString().trim();
      const topicsArr = (sel.topics && sel.topics.length) ? sel.topics : (sel.topic ? [sel.topic] : []);
      if (topicsArr.length) notes = `${t('appt.topicLabel')}: ${topicsArr.join(', ')}` + (notes ? `\n${notes}` : '');
      const payload = { slotId: sel.slotId, product: sel.product, topics: topicsArr, firstName: fd.get('firstName'), lastName: fd.get('lastName'), email: fd.get('email'), phone: fd.get('phone'), company: fd.get('company'), notes };
      try { const r = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!r.ok) throw new Error(); apptForm.reset(); show('done'); }
      catch { apptMsg.className = 'form-msg err'; apptMsg.textContent = t('msg.leadErr'); }
    });

    $('#calPrev').addEventListener('click', () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderCalendar(); });
    $('#calNext').addEventListener('click', () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderCalendar(); });
    $$('[data-appt-back]').forEach(b => b.addEventListener('click', () => show(b.dataset.apptBack)));
    $$('[data-open-appointment]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
    $$('[data-close-appointment]').forEach(b => b.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }

  /* ===== Çerez onay banner'ı (tüm sayfalarda, ilk ziyarette) ===== */
  function initCookieBanner() {
    if (localStorage.getItem('fe-cookie-consent')) return; // kullanıcı zaten seçti
    const bar = document.createElement('div');
    bar.id = 'cookieBar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = `
      <span class="cookie-text">${t('cookie.text')}</span>
      <div class="cookie-btns">
        <button type="button" id="cookieAccept" class="btn btn-primary">${t('cookie.accept')}</button>
        <button type="button" id="cookieReject" class="btn btn-ghost-light">${t('cookie.reject')}</button>
      </div>`;
    document.body.appendChild(bar);
    const dismiss = (v) => { try { localStorage.setItem('fe-cookie-consent', v); } catch {} bar.remove(); };
    bar.querySelector('#cookieAccept').addEventListener('click', () => dismiss('accepted'));
    bar.querySelector('#cookieReject').addEventListener('click', () => dismiss('rejected'));
  }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
    applyLang(); bindLang(); bindHeader(); markActiveNav(); bindReveal(); bindParallaxBg(); bindCountUp();
    bindLeadForm(); bindAppointment();
    // Kariyer başvuru formu (varsa) — Çalışan Adayı Aydınlatma ve Açık Rıza Metni onayı.
    // Kariyer'in kendi submit handler'ı #applyKvkk.checked bekliyor; inject o id
    // ile "Metni aç ve onayla" popup'lı checkbox üretir ama bağlam belgesi calisan-adayi.
    const applyForm = $('#applyForm');
    if (applyForm) injectKvkkCheckbox(applyForm, 'applyKvkk', {
      docSlug: 'calisan-adayi',
      label: LANG === 'en'
        ? 'I have read and accept the Candidate Applicant Notice and Explicit Consent.'
        : 'Çalışan Adayı Aydınlatma ve Açık Rıza Metni\'ni okudum ve onaylıyorum.',
    });
    loadServices(); loadBrands(); loadBlog(); loadAnnouncements(); loadVideoUrls();
    loadRefs(); loadContact(); initAnnouncementPopup();
    initCookieBanner();

    // Cross-page anchor düzeltmesi: async içerik (logo şeridi, projeler) yüklenince
    // sayfa yüksekliği değişip hedef kayar. Hash varsa içerik oturduktan sonra yeniden hizala.
    if (location.hash && location.hash.length > 1) {
      const reScroll = () => { const el = document.querySelector(location.hash); if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' }); };
      [250, 700, 1300].forEach(ms => setTimeout(reScroll, ms));
    }
  });
})();
