using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.IO;
using System.Diagnostics;
using System.Drawing.Drawing2D;
using Excel = Microsoft.Office.Interop.Excel; //excel sınıfı
using Microsoft.Office.Interop.Excel;
using System.Data.OleDb;
using System.Globalization;


namespace Instabot
{
    public partial class Form1 : Form
    {
        ChromeDriver drv; Thread th;

        public Form1()
        {
            InitializeComponent();
        }

        string url = "https://www.instagram.com/";
        private void Form1_Load(object sender, EventArgs e)
        {
            string processName = "chrome";
            string pName2 = "chromedriver";// Kapatmak İstediğimiz Program
            Process[] processes = Process.GetProcesses();// Tüm Çalışan Programlar
            foreach (Process process in processes)
            {
                if (process.ProcessName == processName && process.ProcessName == pName2)
                {
                    process.Kill();
                }
              

            }
            timer1.Interval = 1000;
            timer2.Interval = 1000;
        
          
            
            trackBar1.Minimum = 1;
            trackBar1.Value = 5;
            textBox1.Text = trackBar1.Value.ToString();
            trackBar1.Maximum = 50;
            
            bool kontrol = InternetKontrol();
            if (kontrol == true)
            {
                seffafRichTextBox1.Text += "Bot Aktif !";
                            
            }
            else
            {
                seffafRichTextBox1.Text = "İnternet'e Bağlantınızı kontrol edip yeniden başlatın.";
                seffafRichTextBox1.ForeColor = Color.Red;
            }

            listBox1.SelectionMode = SelectionMode.MultiSimple; // Çoklu seçim
            listBox2.SelectionMode = SelectionMode.MultiSimple;  // yapılabilmesi için
            listBox3.SelectionMode = SelectionMode.MultiSimple;

            button1.Enabled = false;
            button2.Enabled = false;
            button5.Enabled = false;
            button6.Enabled = false;
            button15.Enabled= false;
        }
        public bool InternetKontrol()
        {
            try
            {
                System.Net.Sockets.TcpClient kontrol_client = new System.Net.Sockets.TcpClient("www.google.com.tr", 80);
                kontrol_client.Close();
                return true;
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return false;
            }
        }

        private void clstr()
        {
            ChromeOptions options = new ChromeOptions();
            options.AddArguments(@"user-data-dir=" + System.Windows.Forms.Application.StartupPath + "\\profile");
            options.AddExcludedArgument("enable-automation");

            ChromeDriverService service = ChromeDriverService.CreateDefaultService();
            service.HideCommandPromptWindow = true;
            try
            {
                drv = new ChromeDriver(service, options);
            }
            catch
            {
                MessageBox.Show("chrome driver sürümünüz güncel olmayabilir veya açık bir chrome sayfası olabilir.");
                
            }
            
            
            drv.Manage().Window.Size = new Size(816, 489);
            try
            {
                drv.Navigate().GoToUrl(url);
            }
            catch (WebDriverException)
            { }
           
        }
        string tkpcisayisi;
        private void button1_Click(object sender, EventArgs e)
        {
            listBox1.Items.Clear();
            seffafRichTextBox1.Text += Environment.NewLine + "Giriş yapıldı.";
            seffafRichTextBox1.Text += Environment.NewLine + "Profile yönlendiriliyor.";

            int kaydırma = 0 ,sleep= 1200;
        A:
            listBox1.Items.Clear();
            {
                url = "https://www.instagram.com/";
                drv.Navigate().GoToUrl(url);
                Thread.Sleep(1500);
                IWebElement llink = drv.FindElement(By.CssSelector("#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.ctQZg.KtFt3 > div > div:nth-child(6) > div.EforU"));
                llink.Click();
                Thread.Sleep(500);
                IWebElement profillink = drv.FindElement(By.CssSelector("#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.ctQZg.KtFt3 > div > div:nth-child(6) > div.poA5q > div.uo5MA._2ciX.tWgj8.XWrBI > div._01UL2 > a:nth-child(1) > div"));
                profillink.Click();
                Thread.Sleep(1500);

                //tkpcisayisi = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > div > span")).Text; //Takipçiler SAYISI    
            }


            tkpcisayisi = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > ul > li:nth-child(2) > a > div > span")).Text; //Takipçiler SAYISI
            IWebElement followerLink = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > ul > li:nth-child(2) > a"));
            followerLink.Click();
            Thread.Sleep(2500);


            //ScrollDown Start
            //isgrP

            
            {
                string jsCommand = "" +
                "sayfa = document.querySelector('.isgrP');" +
                "sayfa.scrollTo(0,sayfa.scrollHeight);" +
                "var sayfaSonu = sayfa.scrollHeight;" +
                "return sayfaSonu;";

            IJavaScriptExecutor js = (IJavaScriptExecutor)drv;
            var sayfaSonu = Convert.ToInt32(js.ExecuteScript(jsCommand));

            
                while (true)
                {
                    var son = sayfaSonu;
                    Thread.Sleep(sleep);
                    sayfaSonu = Convert.ToInt32(js.ExecuteScript(jsCommand));
                    if (son == sayfaSonu)
                        break;
                }



                //ScrollDown End


                //Takipçi Listeleme Start

             
            IReadOnlyCollection<IWebElement> follwers = drv.FindElements(By.CssSelector("._7UhW9.xLCgt.qyrsm.KV-D4.se6yk.T0kll"));
            
            foreach (IWebElement follower in follwers)
            {
                listBox1.Items.Add(follower.Text);
                    label11.Text = "Liste toplam : " + listBox1.Items.Count;


            }

                int toplam;

                if (listBox1.Items.Count != Convert.ToInt32(tkpcisayisi))
                {
                    if (kaydırma == 3)
                    {
                        seffafRichTextBox1.Text += Environment.NewLine + "liste zaman aşımına uğradı 10 dakika sonra otomatik tekrar kontrol edilecek.";
                        Thread.Sleep(1000 * 60 * 10); // 10 dakika bekleme
                        kaydırma = 0;
                        goto A;
                    }
                    else
                    {
                        seffafRichTextBox1.Text += Environment.NewLine + "Takipçiler Listesi güncellenemedi";
                        seffafRichTextBox1.Text += Environment.NewLine + "İşlemler yenileniyor lütfen bekleyin...";
                        toplam = listBox1.Items.Count;
                        label11.Text = "Liste toplam : " + toplam;
                        listBox1.Items.Clear();
                        sleep += 500;
                        kaydırma++;
                        goto A;
                    }

                }
                else
                {
                    seffafRichTextBox1.Text += Environment.NewLine + "Takipçiler Listesi başarıyla güncellendi";
                    toplam = listBox1.Items.Count;
                    label11.Text = "Liste toplam : " + toplam;
                }
                //Takipçi Listeleme END
            }
           

        }
        string tkpettiklerimsayisi;
        private void button2_Click(object sender, EventArgs e)
        {
            listBox2.Items.Clear();
            seffafRichTextBox1.Text += Environment.NewLine + "Profile yönlendiriliyor.";
            int kaydırma = 0, sleep = 1000;
            
        B:
            listBox2.Items.Clear();
            {
                url = "https://www.instagram.com/";
                drv.Navigate().GoToUrl(url);
                Thread.Sleep(1500);

                IWebElement llink = drv.FindElement(By.CssSelector("#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.ctQZg.KtFt3 > div > div:nth-child(6) > div.EforU"));
                llink.Click();
                Thread.Sleep(500);
                IWebElement profillink = drv.FindElement(By.CssSelector("#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.ctQZg.KtFt3 > div > div:nth-child(6) > div.poA5q > div.uo5MA._2ciX.tWgj8.XWrBI > div._01UL2 > a:nth-child(1) > div"));
                profillink.Click();
                Thread.Sleep(1500);             
            }


            tkpettiklerimsayisi = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > div > span")).Text; //Takip Ettiklerim SAYISI

            IWebElement followerLink = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > ul > li:nth-child(3) > a > div"));
            followerLink.Click();
            Thread.Sleep(2500);


            //ScrollDown Start
            //isgrP
            try
            { 
                string jsCommand = "" +
                "sayfa = document.querySelector('.isgrP');" +
                "sayfa.scrollTo(0,sayfa.scrollHeight);" +
                "var sayfaSonu = sayfa.scrollHeight;" +
                "return sayfaSonu;";

            IJavaScriptExecutor js = (IJavaScriptExecutor)drv;
            var sayfaSonu = Convert.ToInt32(js.ExecuteScript(jsCommand));

            while (true)
            {
                var son = sayfaSonu;
                Thread.Sleep(sleep);
                sayfaSonu = Convert.ToInt32(js.ExecuteScript(jsCommand));
                if (son == sayfaSonu)
                    break;
            }
            IReadOnlyCollection<IWebElement> follwers = drv.FindElements(By.CssSelector("._7UhW9.xLCgt.qyrsm.KV-D4.se6yk.T0kll"));

            foreach (IWebElement follower in follwers)
            {
                listBox2.Items.Add(follower.Text);
                
            }
                int toplam;
                if (listBox2.Items.Count  != Convert.ToInt32(tkpettiklerimsayisi))
                {
                    if (kaydırma == 3)
                    {
                        seffafRichTextBox1.Text += Environment.NewLine + "Takip Ettiklerim listesi zaman aşımına uğradı 10 dakika sonra otomatik tekrar kontrol edilecek.";
                        Thread.Sleep(1000 * 60 * 10); // 10 dakika bekleme
                        kaydırma = 0;
                        goto B;
                    }
                    else
                    {
                        seffafRichTextBox1.Text += Environment.NewLine + "Takip Ettiklerim listesi güncellenemedi";
                        seffafRichTextBox1.Text += Environment.NewLine + "İşlemler yenileniyor...";
                        toplam = listBox2.Items.Count;
                        label12.Text = "Liste toplam : " + toplam;
                        listBox2.Items.Clear();
                        sleep += 500;
                        kaydırma++;
                        goto B;
                    }
                }
                else
                {
                    seffafRichTextBox1.Text += Environment.NewLine + "Takip Ettiklerim Listesi başarıyla güncellendi";
                    toplam = listBox2.Items.Count;
                    label12.Text = "Liste toplam : " + toplam;
                    
                }
            }
            catch (WebDriverException)
            {

                if (kaydırma == 3)
                {
                    seffafRichTextBox1.Text += Environment.NewLine + "Takip Ettiklerim listesi zaman aşımına uğradı 1 dakika sonra tekrar kontrol edilecek.";
                    Thread.Sleep(1000 * 60 * 1); // 1 dakika bekleme
                    kaydırma = 0;
                    goto B;
                }
                else
                {
                    seffafRichTextBox1.Text += Environment.NewLine + "Takip Ettiklerim Listesi güncellenemedi";
                    seffafRichTextBox1.Text += Environment.NewLine + "İşlemler yenileniyor lütfen bekleyin...";
                    listBox2.Items.Clear();
                    sleep += 500;
                    kaydırma++;
                    goto B;
                }

            }

            //ScrollDown End


            //Takip ettiklerim Listeleme Start
            //Takip ettiklerim Listeleme END
        }

        private void button3_Click(object sender, EventArgs e)
        {
            button5.Enabled = true;
            button6.Enabled = true;
            button15.Enabled = true;
            listBox3.Items.Clear();

            foreach (var item in listBox2.Items)
            {
                if (listBox1.Items.IndexOf(item) >= 0)
                {  }
                else
                {
                    listBox3.Items.Add(item);

                }
            }
           label13.Text= "Liste toplam : " + listBox3.Items.Count.ToString();
        }

        private void trackBar1_Scroll(object sender, EventArgs e)
        {
            textBox1.Text = trackBar1.Value.ToString();
            if (Convert.ToInt32( textBox1.Text) < 1)
            {
                textBox1.Text = "1";
            }

            if (Convert.ToInt32(textBox1.Text)*24 > 200)
            {
            label5.ForeColor = Color.Red;
            }
            else
            {
            label5.ForeColor = Color.Black;
            }
            
        }

        private void textBox1_TextChanged(object sender, EventArgs e)
        
        {
            label5.Text = Convert.ToString("24 saatte " + trackBar1.Value * 24 + " işlem yapar.");
            try
            {
                if (Convert.ToInt32(textBox1.Text) < 1 | Convert.ToInt32(textBox1.Text) > 50)
                {
                    textBox1.Text = "1";
                    trackBar1.Value = 1;
                }
                else
                {                  
                    trackBar1.Value = Convert.ToInt32(textBox1.Text);
                }
            }
            catch (FormatException)
            {   }                            
        }

        private void textBox1_KeyPress(object sender, KeyPressEventArgs e)
        {
            e.Handled = !char.IsDigit(e.KeyChar) && !char.IsControl(e.KeyChar); //sadece rakam
            e.Handled = Char.IsWhiteSpace(e.KeyChar); // boşluk engelleme
        }

        private void button4_Click(object sender, EventArgs e)
        {
            seffafRichTextBox1.Text += Environment.NewLine + "----------------------------------------";
            seffafRichTextBox1.Text += Environment.NewLine + "Giriş yapmanız bekleniyor...";
            seffafRichTextBox1.ForeColor = Color.Green;
            
           
            th = new Thread(clstr); th.Start();

            
            button1.Enabled = true;
            button2.Enabled = true;

        }
        
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            string processName = "chrome";
            string pName2 = "chromedriver";// Kapatmak İstediğimiz Program
            Process[] processes = Process.GetProcesses();// Tüm Çalışan Programlar
            foreach (Process process in processes)
            {
                if (process.ProcessName == processName && process.ProcessName == pName2)
                {
                    process.Kill();
                }


            }
            if (th == null)
            {}
            else
            {
                try
                {
                   
                    drv.Close();
                    drv.Quit();
                    this.drv.Dispose();
                    

                }
                catch (WebDriverException)
                {

                }                              
            }
        }

        private void button5_Click(object sender, EventArgs e)
        {
            butonkapat();
            timer1.Start();
            timer1.Enabled = true;                     
        }
      
        private void timer1_Tick(object sender, EventArgs e)
        {
            if (timer1.Interval == 1000 )
            {
                timer1.Interval = 1000 * 60 * 30; 
                timer2.Interval = 3000;
            }

            
            timer2.Start();

            if (listBox3.Items.Count == 0)
            {
                seffafRichTextBox1.Text += Environment.NewLine + "İşlem tamamlandı ";
                seffafRichTextBox1.Text += Environment.NewLine + "Takip etmeyenler listesi boş ";
                timer1.Stop();
                butonac();


            }
            else
            {
                seffafRichTextBox1.Text += Environment.NewLine + "İşlem başlıyor işlem saati : " + DateTime.Now.ToLongTimeString();
            }

        }
        public int d = 0;
        int cıkaralınsayi=1;
        int hatasayi = 1;
        private void timer2_Tick(object sender, EventArgs e)
        {
            foreach (var item in listBox4.Items)
            {
                if (listBox3.Items.IndexOf(item) >= 0)
                {
                    listBox3.Items.Remove(item);
                }
               
            }
            if (timer2.Interval == 3000)
            {                
                timer2.Interval = (timer1.Interval / trackBar1.Value) - 2000;
            }
            
           
            int a = 0;
           
            
            if (d == trackBar1.Value)
            {
                timer2.Stop();
                seffafRichTextBox1.Text += Environment.NewLine + "İşlem bitti";
                butonac();

                d = 0;
            }
            else
            {
                try
                {
                    drv.Navigate().GoToUrl("https://www.instagram.com/" + listBox3.Items[a]);
                    Thread.Sleep(3000);
                    try
                    {
                        IWebElement takiptencıkra1 = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > div.XBGH5 > div.qF0y9.Igw0E.IwRSH.eGOV_.ybXk5._4EzTm.bPdm3 > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm.soMvl > div > span > span.vBF20._1OSdk > button"));
                        takiptencıkra1.Click();
                        IWebElement takiptencıkra2 = drv.FindElement(By.CssSelector("body > div.RnEpo.Yx5HN > div > div > div > div.mt3GC > button.aOOlW.-Cab_"));
                        takiptencıkra2.Click();
                        Thread.Sleep(1000);
                        seffafRichTextBox1.Text += Environment.NewLine + listBox3.Items[a] + "  Kullanıcısı takipten çıkarıldı" + " işlem saati :" + DateTime.Now.ToLongTimeString();
                        
                        listBox3.Items.RemoveAt(a);
                        label8.Text = cıkaralınsayi++.ToString();                                          
                    }
                    catch (NoSuchElementException)
                    {
                        seffafRichTextBox1.Text += Environment.NewLine + "HATA! " + listBox3.Items[a] + "   Kullanıcısı takipten çıkarılamadı" + " işlem saati :" + DateTime.Now.ToLongTimeString(); ;
                        seffafRichTextBox1.ForeColor = Color.Red;
                        listBox3.Items.RemoveAt(a);
                        label10.Text = hatasayi++.ToString();
                    }
                    a++;
                }
                catch (ArgumentOutOfRangeException)
                {                }
            }
            d++;

        }

        private void button7_Click(object sender, EventArgs e)
        {
            if (listBox1.SelectedItems != null)
            {
                
            
            for (int i = listBox1.SelectedIndices.Count - 1; i >= 0; i--)
            {
                //Seçili elemanı 4. listeye ekle
                listBox4.Items.Add(listBox1.SelectedItems[i]);
                

            }
            listBox1.SelectedIndex = -1;
            }
        }

        private void button8_Click(object sender, EventArgs e)
        {
            if (listBox2.SelectedItems != null)
            {
              
            
            for (int i = listBox2.SelectedIndices.Count - 1; i >= 0; i--)
            {
                //Seçili elemanı 4. listeye ekle
                listBox4.Items.Add(listBox2.SelectedItems[i]);
                listBox2.ClearSelected();
            }
            }
        }

        private void button9_Click(object sender, EventArgs e)
        {
            if (listBox3.SelectedItems != null)
            {               
            for (int i = listBox3.SelectedIndices.Count - 1; i >= 0; i--)
            {
                //Seçili elemanı 4. listeye ekle
                listBox4.Items.Add(listBox3.SelectedItems[i]);
                listBox3.ClearSelected();

            }
            }
        }

        private void button11_Click(object sender, EventArgs e)
        {
            listBox1.Items.Clear();
        }

        private void button12_Click(object sender, EventArgs e)
        {
            listBox2.Items.Clear();
        }

        private void button13_Click(object sender, EventArgs e)
        {
            listBox3.Items.Clear();
        }

        private void button14_Click(object sender, EventArgs e)
        {
            listBox4.Items.Clear();
        }

        private void button6_Click(object sender, EventArgs e)
        {
            if (th == null)
            { }
            else
            {            
                drv.Close();
                drv.Quit();
                this.drv.Dispose();
            }
            butonac();
        }
       

        private void button10_Click(object sender, EventArgs e)
        {
            if (listBox4.SelectedItems != null)
            {
                listBox4.Items.Remove(listBox4.SelectedItem);
            }
            
        }

        public void butonkapat()
        {          
            button7.Enabled = false;
            button8.Enabled = false;
            button9.Enabled = false;
            button10.Enabled = false;
            button11.Enabled = false;
            button12.Enabled = false;
            button13.Enabled = false;
            button14.Enabled = false;          
            button15.Enabled = false;

            textBox1.Enabled = false;
            button1.Enabled = false;
            button2.Enabled = false;
            button3.Enabled = false;
        }

        public void butonac()
        {
            button7.Enabled = true;
            button8.Enabled = true;
            button9.Enabled = true;
            button10.Enabled = true;
            button11.Enabled = true;
            button12.Enabled = true;
            button13.Enabled = true;
            button14.Enabled = true;
            button15.Enabled = true;

            textBox1.Enabled = true;
            button1.Enabled = true;
            button2.Enabled = true;
            button3.Enabled = true;

            trackBar1.Enabled = true;
        }

        private void button15_Click(object sender, EventArgs e)
        {
            trackBar1.Enabled = false;
            timer3.Enabled = true;
            timer3.Start();
            timer3.Interval = 100;
            butonkapat();
        }

        private void timer3_Tick(object sender, EventArgs e)
        {
            
            foreach (var item in listBox4.Items)
            {
                if (listBox3.Items.IndexOf(item) >= 0)
                {
                    listBox3.Items.Remove(item);
                }

            }
            if (timer3.Interval == 100)
            {
                timer3.Interval = 5000;
            }


            int a = 0;


            if (d == trackBar1.Value)
            {
                
                seffafRichTextBox1.Text += Environment.NewLine + "İşlem bitti";
                butonac();
                d = 0;
                timer3.Stop();
            }
            else
            {
                try
                {
                    drv.Navigate().GoToUrl("https://www.instagram.com/" + listBox3.Items[a]);
                    Thread.Sleep(3000);
                    try
                    {
                        //IWebElement takiptencıkra1 = drv.FindElement(By.CssSelector("#react-root > section > main > div > header > section > div.XBGH5 > div.qF0y9.Igw0E.IwRSH.eGOV_.ybXk5._4EzTm.bPdm3 > div > div.qF0y9.Igw0E.IwRSH.eGOV_._4EzTm.soMvl > div > span > span.vBF20._1OSdk > button"));
                        //takiptencıkra1.Click();
                        //IWebElement takiptencıkra2 = drv.FindElement(By.CssSelector("body > div.RnEpo.Yx5HN > div > div > div > div.mt3GC > button.aOOlW.-Cab_"));
                        //takiptencıkra2.Click();
                        //Thread.Sleep(1000);
                        seffafRichTextBox1.Text += Environment.NewLine + listBox3.Items[a] + "  Kullanıcısı takipten çıkarıldı" + " işlem saati :" + DateTime.Now.ToLongTimeString();
                        if (listBox2.Items.Contains(listBox3.Items[a]))
                        {
                            int index = listBox2.FindString(Convert.ToString(listBox3.Items[a]));

                            // aranan metin ListBox içinde bulunamazsa geriye -1 döner
                            if (index != -1)
                            {
                                listBox2.Items.RemoveAt(index);
                            }
                        }                                                                        
                        listBox3.Items.RemoveAt(a);
                        label8.Text = cıkaralınsayi++.ToString();                      
                    }
                    catch (NoSuchElementException)
                    {
                        seffafRichTextBox1.Text += Environment.NewLine + listBox3.Items[a] + "  Kullanıcısı takipten çıkarılamadı" + " işlem saati :" + DateTime.Now.ToLongTimeString(); ;
                        seffafRichTextBox1.ForeColor = Color.Red;
                        listBox3.Items.RemoveAt(a);
                        label10.Text = hatasayi++.ToString();
                    }
                    a++;
                    d++;
                }
                catch (ArgumentOutOfRangeException)
                { }
            }
            
        }

        private void button16_Click(object sender, EventArgs e)
        {
            using (SaveFileDialog sfd = new SaveFileDialog() { Filter = "Excel Workbook|*.xls", ValidateNames = true })
            {
                if (sfd.ShowDialog() == DialogResult.OK)
                {
                    Excel.Application excel = new Excel.Application();
                    excel.Visible = false;
                    object Missing = Type.Missing;
                    Workbook wb = excel.Workbooks.Add(Missing);
                    Worksheet ws = (Worksheet)wb.Sheets[1];
                   
                    ws.Cells[1, 1] = "Takipçiler Listesi";
                    ws.Cells[1, 2] = "Takip Ettiklerim";
                    ws.Cells[1, 3] = "Takip Etmeyenler";
                    ws.Cells[1, 4] = "Link";

                    for (int i = 0; i < listBox1.Items.Count; i++)
                    {
                        ws.Cells[i + 2, 1] = listBox1.Items[i].ToString();
                    }

                    for (int i = 0; i < listBox2.Items.Count; i++)
                    {
                        ws.Cells[i + 2, 2] = listBox2.Items[i].ToString();
                    }

                    for (int i = 0; i < listBox3.Items.Count; i++)
                    {
                        ws.Cells[i + 2, 3] = listBox3.Items[i].ToString();
                    }
                    for (int i = 0; i < listBox3.Items.Count; i++)
                    {
                        ws.Cells[i + 2, 4] = "https://www.instagram.com/" + listBox3.Items[i].ToString();
                    }
                    
                    ws.Columns.AutoFit();
                    ws.Rows.AutoFit();


                    wb.SaveAs(sfd.FileName, Excel.XlFileFormat.xlWorkbookNormal, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Excel.XlSaveAsAccessMode.xlExclusive, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing);
                    wb.Close(true, Type.Missing, Type.Missing);
                   

                   
                    excel.Quit();
                    MessageBox.Show("Excel kayıt tamamlandı.");
                }
            }
        }       
    }
}
